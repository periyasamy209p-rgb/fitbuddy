import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { Modality, LiveServerMessage } from '@google/genai';
import {
  save_user,
  save_plan,
  update_plan,
  get_user,
  get_original_plan,
  get_all_users_with_plans,
  delete_user,
  execute_raw_sql,
  getDbStats,
  getDb,
  getDbPath,
} from './server/db.ts';
import {
  generate_workout_gemini,
  generate_nutrition_tip_with_flash,
  update_workout_plan,
  search_grounding_gemini,
  getAiClient,
} from './server/gemini.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize SQLite database on startup
  try {
    await getDb();
    console.log('[SQLite] fitbuddy.db initialized successfully.');
  } catch (err) {
    console.error('[SQLite] Error initializing database:', err);
  }

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const server = http.createServer(app);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Explicitly allow microphone permissions in browser policy headers
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'microphone=*');
    res.setHeader('Feature-Policy', "microphone '*'");
    next();
  });

  // Request logger for API calls
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // 1. Generate workout plan & nutrition tip
  // Corresponds to PDF: /generate-workout
  app.post('/api/generate-workout', async (req: Request, res: Response) => {
    try {
      const { username, user_id, age, weight, goal, intensity, useSearchGrounding } = req.body;

      if (!username || !user_id || !goal || !intensity) {
        return res.status(400).json({
          error: 'Missing required fields: username, user_id, goal, and intensity are required.',
        });
      }

      const parsedAge = parseInt(age, 10) || 25;
      const parsedWeight = parseFloat(weight) || 70.0;
      const validIntensity = (['low', 'medium', 'high'].includes(String(intensity).toLowerCase())
        ? String(intensity).toLowerCase()
        : 'medium') as 'low' | 'medium' | 'high';

      // 1. Call Gemini for 7-day workout plan (optionally grounded with Google Search)
      const { plan: workoutPlanText, sources } = await generate_workout_gemini({
        name: String(username).trim(),
        user_id,
        age: parsedAge,
        weight: parsedWeight,
        goal: String(goal).trim(),
        intensity: validIntensity,
        useSearchGrounding: Boolean(useSearchGrounding),
      });

      // 2. Call Gemini Flash for concise nutrition tip
      const nutritionTipText = await generate_nutrition_tip_with_flash(String(goal).trim(), validIntensity);

      // 3. Store user in SQLite database
      const user = await save_user(
        user_id,
        String(username).trim(),
        parsedAge,
        parsedWeight,
        String(goal).trim(),
        validIntensity
      );

      // 4. Store plan in SQLite database
      const plan = await save_plan(user_id, workoutPlanText, nutritionTipText);

      return res.status(200).json({
        success: true,
        message: 'Workout plan generated and saved successfully to SQLite!',
        user,
        plan: {
          original_plan: plan.original_plan,
          updated_plan: plan.updated_plan,
          nutrition_tip: plan.nutrition_tip,
          feedback_history: plan.feedback_history,
          created_at: plan.created_at,
          updated_at: plan.updated_at,
          grounding_sources: sources || [],
        },
      });
    } catch (error: any) {
      console.error('Error generating workout plan:', error);
      return res.status(500).json({
        error: error.message || 'Failed to generate workout plan. Please try again.',
      });
    }
  });

  // 2. Submit feedback and update workout plan
  // Corresponds to PDF: /submit-feedback or /update-plan/{user_id}
  app.post('/api/submit-feedback', async (req: Request, res: Response) => {
    try {
      const { user_id, feedback } = req.body;

      if (!user_id || !feedback || !String(feedback).trim()) {
        return res.status(400).json({
          error: 'user_id and feedback are required.',
        });
      }

      const existingPlan = await get_original_plan(user_id);
      const user = await get_user(user_id);

      if (!existingPlan) {
        return res.status(404).json({
          error: `Original plan not found for user ID: ${user_id}. Please generate a workout plan first.`,
        });
      }

      const currentPlanContent = existingPlan.updated_plan || existingPlan.original_plan;

      // Revise plan using Gemini
      const updatedPlanText = await update_workout_plan(currentPlanContent, String(feedback).trim());

      // Generate adapted nutrition/recovery tip
      const updatedNutritionTip = await generate_nutrition_tip_with_flash(
        user?.goal || 'general fitness',
        user?.intensity || 'medium'
      );

      // Update in SQLite database
      const savedPlan = await update_plan(
        user_id,
        updatedPlanText,
        updatedNutritionTip,
        String(feedback).trim()
      );

      return res.status(200).json({
        success: true,
        message: 'Your plan has been updated based on your feedback!',
        user,
        plan: savedPlan,
      });
    } catch (error: any) {
      console.error('Error in submit-feedback:', error);
      return res.status(500).json({
        error: error.message || 'Failed to update workout plan with feedback.',
      });
    }
  });

  // 3. Nutrition tip generation endpoint
  // Corresponds to PDF: /nutrition-tip
  app.get('/api/nutrition-tip', async (req: Request, res: Response) => {
    try {
      const goal = String(req.query.goal || 'general fitness');
      const intensity = String(req.query.intensity || 'medium');
      const tip = await generate_nutrition_tip_with_flash(goal, intensity);
      return res.json({ goal, intensity, nutrition_tip: tip });
    } catch (error: any) {
      console.error('Error fetching nutrition tip:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch nutrition tip' });
    }
  });

  // 4. Google Search Grounding with gemini-3.5-flash
  // Mandated Feature: "Use Google Search data (with gemini-3.5-flash and googleSearch tool)"
  app.post('/api/search-grounding', async (req: Request, res: Response) => {
    try {
      const { query, context } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query string is required' });
      }

      const result = await search_grounding_gemini(query, context);
      return res.json(result);
    } catch (error: any) {
      console.error('Error executing search grounding:', error);
      return res.status(500).json({ error: error.message || 'Failed to run search grounding' });
    }
  });

  // 5. View all registered users and plans
  // Corresponds to PDF: /view-all-users
  app.get('/api/view-all-users', async (req: Request, res: Response) => {
    try {
      const allData = await get_all_users_with_plans();
      return res.json({ users: allData });
    } catch (error: any) {
      console.error('Error fetching all users:', error);
      return res.status(500).json({ error: 'Failed to retrieve users from SQLite database' });
    }
  });

  // 6. Get individual user record and plans
  app.get('/api/users/:user_id', async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const user = await get_user(user_id);
      const plan = await get_original_plan(user_id);

      if (!user) {
        return res.status(404).json({ error: 'User not found in SQLite database' });
      }

      return res.json({ user, plan });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // 7. Delete user (Admin Panel feature from PDF)
  app.delete('/api/users/:user_id', async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const success = await delete_user(user_id);
      if (!success) {
        return res.status(404).json({ error: 'User not found or already deleted from database' });
      }
      return res.json({ success: true, message: `User ${user_id} deleted successfully from SQLite database.` });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // 8. SQLite Database Info & Health
  app.get('/api/database/info', async (req: Request, res: Response) => {
    try {
      const stats = getDbStats();
      const allUsers = await get_all_users_with_plans();
      return res.json({
        ...stats,
        totalUsers: allUsers.length,
        totalUpdatedPlans: allUsers.filter((u) => u.has_updated_plan).length,
        schema: [
          {
            table: 'users',
            columns: ['id (TEXT PRIMARY KEY)', 'name (TEXT)', 'age (INTEGER)', 'weight (REAL)', 'goal (TEXT)', 'intensity (TEXT)', 'schedule (INTEGER)', 'created_at (TEXT)'],
          },
          {
            table: 'plans',
            columns: ['user_id (TEXT PRIMARY KEY)', 'original_plan (TEXT)', 'updated_plan (TEXT)', 'nutrition_tip (TEXT)', 'created_at (TEXT)', 'updated_at (TEXT)'],
          },
          {
            table: 'feedback_history',
            columns: ['id (INTEGER PRIMARY KEY)', 'user_id (TEXT)', 'feedback (TEXT)', 'timestamp (TEXT)'],
          },
        ],
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // 9. Execute Raw SQL Query
  app.post('/api/database/sql', async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query string is required' });
      }
      const result = await execute_raw_sql(query);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // 10. Download SQLite fitbuddy.db file
  app.get('/api/database/download', (req: Request, res: Response) => {
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) {
      return res.status(404).send('Database file not found');
    }
    res.download(dbPath, 'fitbuddy.db');
  });

  // WebSocket Server for Gemini Live API Voice Conversations (model: gemini-3.8-live)
  // Mandated Feature: "Add voice conversations (Live API with gemini-3.8-live)"
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname;
    if (pathname !== '/live-coach') return;

    wss.handleUpgrade(request, socket, head, (clientWs) => {
      wss.emit('connection', clientWs, request);
    });
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Live Coach] Client connected to live voice session.');

    let liveSession: any = null;
    const pendingMessages: string[] = [];

    const dispatchMessage = (rawStr: string) => {
      if (!liveSession) return;
      try {
        const msg = JSON.parse(rawStr);
        if (msg.audio) {
          liveSession.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (msg.text) {
          try {
            liveSession.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: msg.text }] }],
              turnComplete: true,
            });
          } catch (textErr) {
            console.error('[Live Coach] Error in sendClientContent:', textErr);
          }
        }
      } catch (err) {
        console.error('[Live Coach] Error processing audio/text message:', err);
      }
    };

    clientWs.on('message', (raw) => {
      const rawStr = raw.toString();
      if (!liveSession) {
        pendingMessages.push(rawStr);
      } else {
        dispatchMessage(rawStr);
      }
    });

    try {
      const ai = getAiClient();
      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction:
            'You are FitBuddy AI Live Coach. You speak to the athlete in real-time over voice during workouts. You give concise, motivational, expert athletic guidance on exercise technique, form, pacing, sets, and rest periods. Keep your spoken responses encouraging, brief, and punchy.',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              clientWs.send(JSON.stringify({ audio: audioData }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.close();
            }
          },
        },
      });

      clientWs.send(JSON.stringify({ status: 'connected', message: 'FitBuddy Live Coach is listening' }));

      // Drain any queued messages that arrived while connecting
      while (pendingMessages.length > 0) {
        const queued = pendingMessages.shift()!;
        dispatchMessage(queued);
      }
    } catch (err: any) {
      console.error('[Live Coach] Failed to establish session with gemini-3.8-live:', err);
      clientWs.send(JSON.stringify({ error: 'Could not connect to Live API: ' + err.message }));
      clientWs.close();
      return;
    }

    clientWs.on('close', () => {
      console.log('[Live Coach] Client disconnected.');
      if (liveSession) {
        try {
          liveSession.close();
        } catch (e) {
          // ignore
        }
      }
    });
  });

  // Integrate Vite dev server middleware or serve dist in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[FitBuddy] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
