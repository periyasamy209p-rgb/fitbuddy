import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

export function getDbPath(): string {
  return path.resolve(process.cwd(), process.env.DB_PATH || 'fitbuddy.db');
}

let dbInstance: Database | null = null;
let sqlEngine: any = null;

export interface UserRecord {
  id: number | string;
  name: string;
  age: number;
  weight: number;
  goal: string;
  intensity: 'low' | 'medium' | 'high';
  schedule: number;
  created_at: string;
}

export interface WorkoutPlanRecord {
  user_id: number | string;
  original_plan: string;
  updated_plan: string | null;
  nutrition_tip: string;
  feedback_history: Array<{ feedback: string; timestamp: string }>;
  created_at: string;
  updated_at: string;
}

/**
 * Initializes and returns the SQLite database instance using SQL.js.
 * Persists to DB_PATH in standard SQLite binary format.
 */
export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDbPath();

  if (!sqlEngine) {
    sqlEngine = await initSqlJs();
  }

  if (fs.existsSync(dbPath)) {
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      dbInstance = new sqlEngine.Database(fileBuffer);
    } catch (e) {
      console.warn('Could not read existing fitbuddy.db, creating fresh SQLite database:', e);
      dbInstance = new sqlEngine.Database();
    }
  } else {
    dbInstance = new sqlEngine.Database();
  }

  // Ensure tables exist according to FitBuddy architecture
  initTables(dbInstance!);
  saveDbToDisk();

  return dbInstance!;
}

function initTables(db: Database) {
  // 1. Users Table (corresponds to PDF User Table)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      weight REAL NOT NULL,
      goal TEXT NOT NULL,
      intensity TEXT NOT NULL,
      schedule INTEGER DEFAULT 7,
      created_at TEXT NOT NULL
    );
  `);

  // 2. WorkoutPlan Table (corresponds to PDF WorkoutPlan Table)
  db.run(`
    CREATE TABLE IF NOT EXISTS plans (
      user_id TEXT PRIMARY KEY,
      original_plan TEXT NOT NULL,
      updated_plan TEXT,
      nutrition_tip TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  // 3. Feedback History Table (corresponds to PDF Scenario 2 feedback loop)
  db.run(`
    CREATE TABLE IF NOT EXISTS feedback_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      feedback TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  // Seed sample initial data if database is empty (Shreya Patel & Marcus Vance from PDF)
  const userCountRes = db.exec("SELECT COUNT(*) as count FROM users");
  const count = userCountRes[0]?.values[0]?.[0] as number;

  if (!count || count === 0) {
    seedInitialData(db);
  }
}

function seedInitialData(db: Database) {
  // Shreya Patel (Case Study in PDF page 22)
  db.run(
    `INSERT OR REPLACE INTO users (id, name, age, weight, goal, intensity, schedule, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['101', 'Shreya Patel', 22, 55.0, 'Muscle gain & core strength', 'high', 7, new Date(Date.now() - 86400000 * 2).toISOString()]
  );

  const shreyaOriginal = `## 7-Day Muscle Gain & Core Strength Plan (High Intensity)

This high-intensity protocol utilizes a structured push-pull-legs and core split strategically placed for maximal hypertrophy and recovery.

### Day 1: Upper Body Push & Core
- Warm-up (8 mins): Arm circles, cat-cow stretch, 2 mins jump rope, band pull-aparts
- Main Workout:
  * Incline Dumbbell Bench Press: 4 sets of 8-10 reps (75s rest)
  * Barbell Overhead Shoulder Press: 3 sets of 8-10 reps (90s rest)
  * Dips (weighted if able): 3 sets of 10-12 reps
  * Cable Triceps Pushdowns: 3 sets of 12-15 reps
  * Hanging Leg Raises: 3 sets of 12 reps
- Cooldown (5 mins): Overhead triceps and chest doorway stretch.

### Day 2: Lower Body Quad & Calves Focus
- Warm-up (7 mins): Bodyweight squats, hip openers, dynamic walking lunges
- Main Workout:
  * Barbell Back Squats: 4 sets of 6-8 reps (2 mins rest)
  * Romanian Deadlifts: 3 sets of 8-10 reps
  * Bulgarian Split Squats: 3 sets of 10 reps per leg
  * Standing Calf Raises: 4 sets of 15 reps
- Cooldown (5 mins): Quad foam rolling and hamstring static stretch.

### Day 3: Active Recovery & Mobility
- Warm-up (5 mins): Diaphragmatic breathing and cat-camel
- Main Session:
  * 30 mins brisk zone 2 incline walk
  * 20 mins thoracic spine and hip mobility routine
- Cooldown: Light full-body stretch and hydration.

### Day 4: Upper Body Pull & Rear Delts
- Warm-up (8 mins): Band face-pulls, arm swings, wrist mobility
- Main Workout:
  * Wide-Grip Lat Pulldowns / Pull-Ups: 4 sets of 8-10 reps
  * Barbell Bent-Over Rows: 4 sets of 8 reps
  * Incline Dumbbell Hammer Curls: 3 sets of 10-12 reps
  * Face Pulls with Rope: 4 sets of 15 reps
  * Cable Woodchoppers: 3 sets of 15 reps per side
- Cooldown (5 mins): Lat stretch and foam roll upper back.

### Day 5: Lower Body Posterior Chain Focus
- Warm-up (8 mins): Glute bridges, high knees, leg swings
- Main Workout:
  * Conventional or Trap Bar Deadlift: 3 sets of 5 reps
  * Barbell Hip Thrusts: 4 sets of 10-12 reps
  * Leg Press (feet high on platform): 3 sets of 12 reps
  * Lying Leg Curls: 3 sets of 12 reps
- Cooldown (5 mins): Pigeon pose and hip flexor kneeling stretch.

### Day 6: Total Body Athletic Conditioning & Core
- Warm-up (6 mins): Shadow boxing, jumping jacks, inchworms
- Main Workout:
  * Kettlebell Swings: 4 sets of 15 reps
  * Dumbbell Push Press: 3 sets of 10 reps
  * Farmer's Walk: 4 sets of 40 meters
  * Ab Wheel Rollouts: 3 sets of 10 reps
  * Plank to Push-Up: 3 sets of 45 seconds
- Cooldown (5 mins): Deep child's pose and cobra stretch.

### Day 7: Complete Rest & Nutritional Reset
- Active rest: Gentle 20-minute nature stroll. Prioritize 8+ hours deep sleep and hydration.`;

  const shreyaUpdated = `## 7-Day Muscle Gain & Core Strength Plan (Updated: Added Yoga & Reduced Spinal Loading)

Based on user feedback: Added dedicated yoga flow transitions and replaced heavy compressive barbell squats with joint-friendly dumbbell variations.

### Day 1: Upper Body Push & Deep Core
- Warm-up (8 mins): Arm swings, band dislocations, wrist mobility
- Main Workout:
  * Incline Dumbbell Bench Press: 4 sets of 8-10 reps
  * Neutral Grip Dumbbell Shoulder Press: 3 sets of 10 reps (elbow-friendly)
  * Cable Chest Flyes: 3 sets of 12 reps
  * Triceps Overhead Cable Extension: 3 sets of 12-15 reps
  * V-Ups & Deadbugs: 3 sets of 12 reps each
- Cooldown (7 mins): 10 minutes of restorative chest-opening yoga poses (Cobra, Puppy Pose).

### Day 2: Lower Body Quad & Glute Hypertrophy (Joint-Friendly)
- Warm-up (8 mins): 90/90 hip flow, bodyweight lunges
- Main Workout:
  * Goblet Squats with elevated heels: 4 sets of 10-12 reps
  * Dumbbell Romanian Deadlifts: 3 sets of 10-12 reps
  * Bulgarian Split Squats (supported): 3 sets of 10 reps/leg
  * Seated Calf Raises: 3 sets of 15 reps
- Cooldown (8 mins): Pigeon pose and low lunge hip flexor release.

### Day 3: Vinyasa Yoga & Active Regeneration
- 40 mins restorative Vinyasa yoga focusing on spinal decompression, hip mobility, and mindful breathing.
- 15 mins cold-hot contrast recovery or gentle walk.

### Day 4: Upper Body Pull & Posterior Delts
- Warm-up (8 mins): Band pull-aparts, thoracic rotations
- Main Workout:
  * Chest-Supported T-Bar Row: 4 sets of 10 reps
  * Neutral Grip Pull-Ups / Lat Pulldown: 3 sets of 10 reps
  * Incline Bicep Curls: 3 sets of 12 reps
  * Rear Delt Dumbbell Flyes: 4 sets of 15 reps
- Cooldown (5 mins): Child's pose with lat reach.

### Day 5: Glutes & Hamstrings Core Integration
- Warm-up (8 mins): Glute bridges, monster walks with mini band
- Main Workout:
  * Barbell Hip Thrust: 4 sets of 10-12 reps
  * Swiss Ball Hamstring Curls: 3 sets of 15 reps
  * Walking Dumbbell Lunges: 3 sets of 12 steps/leg
  * Hanging Knee Raises: 3 sets of 15 reps
- Cooldown (8 mins): Happy baby pose and supine spinal twists.

### Day 6: Athletic Power & Flow Conditioning
- Warm-up (6 mins): Flow movement warm-up
- Main Workout:
  * Kettlebell Swings: 4 sets of 15 reps
  * Dumbbell Clean and Press: 3 sets of 8 reps
  * Turkish Get-Ups: 3 sets of 3 reps per side (superb for core and shoulders)
  * Side Planks with rotation: 3 sets of 30s/side
- Cooldown: Gentle restorative stretch.

### Day 7: Complete Rest & Muscle Recovery
- Sleep 8-9 hours, optimize protein intake, gentle outdoor walk.`;

  db.run(
    `INSERT OR REPLACE INTO plans (user_id, original_plan, updated_plan, nutrition_tip, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      '101',
      shreyaOriginal,
      shreyaUpdated,
      'Prioritize 1.6–2.0g of high-bioavailability protein per kg of body weight (approx 90–110g for 55kg). Consuming 25–30g protein with 40g complex carbs within 60 minutes post-training dramatically accelerates muscle protein synthesis and glycogen replenishment.',
      new Date(Date.now() - 86400000 * 2).toISOString(),
      new Date(Date.now() - 3600000 * 12).toISOString(),
    ]
  );

  db.run(
    `INSERT INTO feedback_history (user_id, feedback, timestamp) VALUES (?, ?, ?)`,
    ['101', 'Add yoga sessions and use exercises that are easier on the lower back/spine.', new Date(Date.now() - 3600000 * 12).toISOString()]
  );

  // Marcus Vance (Scenario 1 & 3 from PDF)
  db.run(
    `INSERT OR REPLACE INTO users (id, name, age, weight, goal, intensity, schedule, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['102', 'Marcus Vance', 29, 78.5, 'Weight loss & athletic endurance', 'medium', 7, new Date(Date.now() - 86400000).toISOString()]
  );

  const marcusOriginal = `## 7-Day Weight Loss & Athletic Endurance Plan (Medium Intensity)

Engineered for metabolic conditioning, continuous caloric expenditure, and cardiovascular resilience without burnout.

### Day 1: Full-Body Functional Circuit
- Warm-up (6 mins): 3 mins jumping rope, arm circles, high knees
- Main Circuit (3 rounds, 60s rest between rounds):
  * Dumbbell Thrusters: 12 reps
  * Kettlebell Deadlifts: 15 reps
  * Push-ups (standard or incline): 12 reps
  * Mountain Climbers: 40 seconds
  * Row Machine or Bike Sprint: 500m / 90 seconds
- Cooldown (5 mins): Calves, hamstrings, and shoulder stretches.

### Day 2: Aerobic Base (Zone 2 Conditioning)
- 40 mins steady-state jog, rowing, or cycling at conversational heart rate (Zone 2, ~65-75% max HR).
- 10 mins core plank circuit (plank, side plank 30s each x 3).

### Day 3: Lower Body Strength & Agility
- Warm-up (7 mins): Leg swings, glute bridges, ankle circles
- Main Workout:
  * Goblet Squats: 3 sets of 12-15 reps
  * Step-Ups with Dumbbells: 3 sets of 10 reps/leg
  * Kettlebell Swings: 4 sets of 20 reps
  * Jump Squats: 3 sets of 10 reps
- Cooldown (5 mins): Quad and hip flexor stretches.

### Day 4: Active Recovery & Gentle Walk
- 45 mins brisk outdoor walk or leisurely swim. Focus on deep diaphragmatic breathing.

### Day 5: Upper Body & HIIT Cardio Finish
- Warm-up (6 mins): Dynamic upper body mobility
- Main Workout:
  * Dumbbell Flat Bench Press: 3 sets of 12 reps
  * Dumbbell Bent-Over Row: 3 sets of 12 reps
  * Overhead Dumbbell Press: 3 sets of 12 reps
  * HIIT Finisher: 8 rounds of 20s sprint / 40s walk on treadmill or air bike.
- Cooldown (5 mins): Doorway stretch and arm across chest.

### Day 6: Core Engine & Agility Ladder
- Warm-up (5 mins): Jumping jacks, lateral lunges
- Main Circuit:
  * Russian Twists: 3 sets of 20 reps
  * Bicycle Crunches: 3 sets of 20 reps
  * Burpees: 3 sets of 10 reps
  * Farmer's Carry: 4 sets of 50m
- Cooldown (5 mins): Cobra stretch, child's pose.

### Day 7: Full Rest & Nutrition Prep
- Rest day. Hydrate with electrolytes and prepare whole-food meals for the upcoming week.`;

  db.run(
    `INSERT OR REPLACE INTO plans (user_id, original_plan, updated_plan, nutrition_tip, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      '102',
      marcusOriginal,
      null,
      'Target a modest caloric deficit of 350–500 kcal below maintenance. Focus on high-satiety fiber (green vegetables, legumes, berries) paired with lean protein to maintain lean muscle mass while torching body fat.',
      new Date(Date.now() - 86400000).toISOString(),
      new Date(Date.now() - 86400000).toISOString(),
    ]
  );
}

export function saveDbToDisk(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(getDbPath(), buffer);
  } catch (err) {
    console.error('Failed writing SQLite binary database to disk:', err);
  }
}

// -------------------------------------------------------------
// Core DAO Functions corresponding to PDF database.py / SQLAlchemy
// -------------------------------------------------------------

export async function save_user(
  userId: number | string,
  name: string,
  age: number,
  weight: number,
  goal: string,
  intensity: 'low' | 'medium' | 'high'
): Promise<UserRecord> {
  const db = await getDb();
  const idStr = String(userId);
  const now = new Date().toISOString();

  // Check if existing user
  const existing = await get_user(idStr);
  const createdAt = existing ? existing.created_at : now;

  db.run(
    `INSERT OR REPLACE INTO users (id, name, age, weight, goal, intensity, schedule, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [idStr, name, age, weight, goal, intensity, 7, createdAt]
  );

  saveDbToDisk();

  return {
    id: idStr,
    name,
    age,
    weight,
    goal,
    intensity,
    schedule: 7,
    created_at: createdAt,
  };
}

export async function save_plan(
  userId: number | string,
  originalPlan: string,
  nutritionTip: string
): Promise<WorkoutPlanRecord> {
  const db = await getDb();
  const idStr = String(userId);
  const now = new Date().toISOString();

  const existing = await get_original_plan(idStr);
  const createdAt = existing ? existing.created_at : now;
  const updatedPlan = existing ? existing.updated_plan : null;

  db.run(
    `INSERT OR REPLACE INTO plans (user_id, original_plan, updated_plan, nutrition_tip, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [idStr, originalPlan, updatedPlan, nutritionTip, createdAt, now]
  );

  saveDbToDisk();

  return {
    user_id: idStr,
    original_plan: originalPlan,
    updated_plan: updatedPlan,
    nutrition_tip: nutritionTip,
    feedback_history: existing?.feedback_history || [],
    created_at: createdAt,
    updated_at: now,
  };
}

export async function update_plan(
  userId: number | string,
  updatedText: string,
  nutritionTip?: string,
  feedback?: string
): Promise<WorkoutPlanRecord | null> {
  const db = await getDb();
  const idStr = String(userId);
  const now = new Date().toISOString();

  const existing = await get_original_plan(idStr);
  if (!existing) return null;

  const tip = nutritionTip !== undefined ? nutritionTip : existing.nutrition_tip;

  db.run(
    `UPDATE plans SET updated_plan = ?, nutrition_tip = ?, updated_at = ? WHERE user_id = ?`,
    [updatedText, tip, now, idStr]
  );

  if (feedback && feedback.trim()) {
    db.run(
      `INSERT INTO feedback_history (user_id, feedback, timestamp) VALUES (?, ?, ?)`,
      [idStr, feedback.trim(), now]
    );
  }

  saveDbToDisk();

  return await get_original_plan(idStr);
}

export async function get_user(userId: number | string): Promise<UserRecord | null> {
  const db = await getDb();
  const stmt = db.prepare(`SELECT * FROM users WHERE id = :id`);
  stmt.bind({ ':id': String(userId) });

  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    stmt.free();
    return {
      id: row.id,
      name: row.name,
      age: Number(row.age),
      weight: Number(row.weight),
      goal: row.goal,
      intensity: row.intensity,
      schedule: Number(row.schedule || 7),
      created_at: row.created_at,
    };
  }
  stmt.free();
  return null;
}

export async function get_original_plan(userId: number | string): Promise<WorkoutPlanRecord | null> {
  const db = await getDb();
  const idStr = String(userId);

  const planStmt = db.prepare(`SELECT * FROM plans WHERE user_id = :user_id`);
  planStmt.bind({ ':user_id': idStr });

  if (!planStmt.step()) {
    planStmt.free();
    return null;
  }

  const planRow = planStmt.getAsObject() as any;
  planStmt.free();

  // Retrieve feedback history
  const fbStmt = db.prepare(
    `SELECT feedback, timestamp FROM feedback_history WHERE user_id = :user_id ORDER BY id ASC`
  );
  fbStmt.bind({ ':user_id': idStr });

  const feedbackHistory: Array<{ feedback: string; timestamp: string }> = [];
  while (fbStmt.step()) {
    const fbRow = fbStmt.getAsObject() as any;
    feedbackHistory.push({
      feedback: fbRow.feedback,
      timestamp: fbRow.timestamp,
    });
  }
  fbStmt.free();

  return {
    user_id: planRow.user_id,
    original_plan: planRow.original_plan,
    updated_plan: planRow.updated_plan || null,
    nutrition_tip: planRow.nutrition_tip || '',
    feedback_history: feedbackHistory,
    created_at: planRow.created_at,
    updated_at: planRow.updated_at,
  };
}

export async function get_all_users_with_plans() {
  const db = await getDb();

  const usersStmt = db.prepare(`SELECT * FROM users ORDER BY created_at DESC`);
  const users: any[] = [];
  while (usersStmt.step()) {
    users.push(usersStmt.getAsObject());
  }
  usersStmt.free();

  const results = [];
  for (const u of users) {
    const plan = await get_original_plan(u.id);
    results.push({
      id: u.id,
      name: u.name,
      age: Number(u.age),
      weight: Number(u.weight),
      goal: u.goal,
      intensity: u.intensity,
      schedule: Number(u.schedule || 7),
      created_at: u.created_at,
      original_plan: plan?.original_plan || 'N/A',
      updated_plan: plan?.updated_plan || null,
      nutrition_tip: plan?.nutrition_tip || 'N/A',
      feedback_history: plan?.feedback_history || [],
      has_updated_plan: Boolean(plan?.updated_plan),
    });
  }

  return results;
}

export async function delete_user(userId: number | string): Promise<boolean> {
  const db = await getDb();
  const idStr = String(userId);

  const existing = await get_user(idStr);
  if (!existing) return false;

  db.run(`DELETE FROM feedback_history WHERE user_id = ?`, [idStr]);
  db.run(`DELETE FROM plans WHERE user_id = ?`, [idStr]);
  db.run(`DELETE FROM users WHERE id = ?`, [idStr]);

  saveDbToDisk();
  return true;
}

export async function execute_raw_sql(sqlQuery: string) {
  const db = await getDb();
  try {
    const results = db.exec(sqlQuery);
    saveDbToDisk();
    return { success: true, results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getDbStats() {
  const dbPath = getDbPath();
  const exists = fs.existsSync(dbPath);
  let sizeBytes = 0;
  if (exists) {
    const stat = fs.statSync(dbPath);
    sizeBytes = stat.size;
  }
  return {
    filePath: dbPath,
    fileName: 'fitbuddy.db',
    exists,
    sizeBytes,
    engine: 'SQLite 3 (via sql.js WebAssembly / native file binary)',
  };
}
