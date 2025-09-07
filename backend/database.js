const sqlite3 = require('sqlite3').verbose(); // SQLite3 library
const path = require('path');

// Create or open a database file located at the specified path
const dbPath = path.resolve(__dirname, 'nutrition.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database: ' + err.message);
  } else {
    console.log('Database connected!');
  }
});





//users table
db.run(`CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  age INTEGER,
  height INTEGER,
  current_weight REAL,
  goal_weight REAL,
  activity_level TEXT,
  gender INTEGER CHECK (gender IN (0, 1)),
  daily_calories INTEGER,
  carbs INTEGER,
  protein INTEGER,
  fat INTEGER,
  goal_type TEXT CHECK(goal_type IN ('app', 'custom')),
  custom_calories INTEGER,
  custom_carbs INTEGER,
  custom_protein INTEGER,
  custom_fat INTEGER
)`, (err) => {
  if (err) {
    console.error('Error creating users table: ' + err.message);
  } else {
    console.log('Users table created or already exists');
  }
});






db.run(`CREATE TABLE IF NOT EXISTS food_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  calories_per_100g REAL,
  carbs_per_100g REAL,
  protein_per_100g REAL,
  fats_per_100g REAL,
  icon TEXT
)`, (err) => {
  if (err) {
    console.error('Error creating food_items table:', err.message);
  } else {
    console.log('Food items table created or exists');
    // Insert sample foods after table creation
    db.run(`INSERT OR IGNORE INTO food_items 
      (name, calories_per_100g, carbs_per_100g, protein_per_100g, fats_per_100g) VALUES
        ('White Cooked Rice', 130, 28.2, 2.7, 0.3),
        ('Chicken Breast', 165, 0, 31, 3.6),
        ('Salmon Fillet', 208, 0, 20, 13),
        ('Ground Beef (80/20)', 254, 0, 17, 20),
        ('Bacon', 541, 1.4, 37, 42),
        ('Peanut Butter', 588, 20, 25, 50),
        ('Almonds', 579, 22, 21, 50),
        ('Whole Milk', 61, 4.7, 3.2, 3.3),
        ('Greek Yogurt', 59, 3.6, 10, 0.4),
        ('Cheddar Cheese', 402, 1.3, 25, 33),
        ('Eggs', 155, 1.1, 13, 11),
        ('Protein Powder', 378, 6.3, 78, 3.2),
        ('Pork Chop', 242, 0, 26, 14),
        ('Tuna in Oil', 198, 0, 29, 8),
        ('Dark Chocolate', 546, 61, 4.9, 31),
        ('White Bread', 265, 49, 9, 3.2),
        ('Whole Wheat Pasta', 124, 25, 5, 1.1),
        ('Oatmeal', 68, 12, 2.4, 1.4),
        ('Hamburger Patty', 295, 0, 19, 24),
        ('French Fries', 312, 41, 3.4, 15),
        ('Pizza Margherita', 268, 33, 11, 9.8),
        ('Chicken Nuggets', 296, 16, 15, 19),
        ('Ice Cream', 207, 24, 3.5, 11),
        ('Potato Chips', 536, 53, 7, 35),
        ('Donut', 452, 51, 5, 25),
        ('Cheesecake', 321, 25, 5.5, 22),
        ('Ramen Noodles', 436, 62, 10, 16),
        ('Pepperoni', 494, 1.2, 22, 44),
        ('Sausage', 346, 2.3, 14, 31),
        ('Granola', 471, 64, 10, 20),
        ('Protein Bar', 386, 29, 20, 22),
        ('Bacon Cheeseburger', 303, 25, 16, 16),
        ('Fried Chicken', 277, 12, 23, 15),
        ('Beef Jerky', 410, 11, 33, 26),
        ('Popcorn', 387, 78, 13, 4.5),
        ('Potato Chips (generic)', 547, 53, 6, 35),
        ('Milk 1%', 42, 5, 3.4, 1),
        ('Olive Oil', 884, 0, 0, 100),
        ('Fried Pork Belly', 588, 0, 11, 60),
        ('Gouda Cheese', 356, 2.2, 25, 27),
        ('Parmesan (Grated)', 420, 3.2, 35, 28),
        ('Feta Cheese', 264, 4.1, 14, 21),
        ('Baked Potato (Plain)', 93, 21, 2.5, 0.1),
        ('Turkey Breast', 135, 0, 29, 1),
        ('Lamb Chops', 332, 0, 25, 25),
        ('Cottage Cheese', 98, 3.4, 11, 4.3),
        ('Sour Cream', 193, 4.3, 2.4, 19),
        ('Mayonnaise', 680, 0.6, 1, 75),
        ('Hummus', 166, 14, 8, 9.6),
        ('Tortilla Chips', 469, 67, 7, 20),
        ('Soy Sauce', 53, 5.6, 8, 0),
        ('Butter', 717, 0.1, 0.8, 81),
        ('Coconut Oil', 862, 0, 0, 100),
        ('Flank Steak', 192, 0, 28, 8),
        ('Canned Tuna (Water)', 86, 0, 19, 1),
        ('Mascarpone', 429, 4.8, 4.1, 43),
        ('Brie Cheese', 334, 0.5, 21, 28),
        ('Mozzarella', 280, 3.1, 22, 17),
        ('Ricotta', 174, 3, 11, 13),
        ('Salami', 336, 1.9, 22, 26),
        ('Chorizo', 455, 2.3, 24, 38),
        ('Ribeye Steak', 291, 0, 25, 21),
        ('Croissant', 406, 45, 8, 21)
      `, (err) => {
      if (err) console.error('Error inserting sample foods:', err.message);
    });
  }
});





db.run(`CREATE TABLE IF NOT EXISTS food_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  date TEXT NOT NULL,
  calories INTEGER,
  carbs INTEGER,
  protein INTEGER,
  fats INTEGER,
  food_item_id INTEGER REFERENCES food_items(id),  
  grams INTEGER,                                  
  FOREIGN KEY(user_id) REFERENCES users(user_id)
)`);




function registerUser(username, password, callback) {
    // Check if the username already exists
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) {
        console.error('Error checking username: ' + err.message);
        callback(err);
      } else if (row) {
        // Username already exists
        callback(new Error('Username is already taken'));
      } else {
        // Username is available, so insert the new user
        const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
        stmt.run([username, password], function(err) {
          if (err) {
            console.error('Error inserting user: ' + err.message);
            callback(err);
          } else {
            console.log(`User registered with ID: ${this.lastID}`);
            callback(null, this.lastID); // Callback with the new user ID
          }
        });
        stmt.finalize();
      }
    });
  }
  





// Function to find a user by username (for login)
function findUserByUsername(username, callback) {
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err) {
      console.error('Error finding user: ' + err.message);
      callback(err);
    } else {
      callback(null, row); // Returns the user data
    }
  });
}






// Function to insert a food log for a user
function insertFoodLog(user_id, date, calories, carbs, protein, fats, food_item_id, grams, callback) {
  const stmt = db.prepare(`INSERT INTO food_logs 
    (user_id, date, calories, carbs, protein, fats, food_item_id, grams)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  
  stmt.run([user_id, date, calories, carbs, protein, fats, food_item_id, grams], function(err) {
    if (err) {
      console.error('Error inserting food log: ' + err.message);
      callback(err);
    } else {
      console.log(`Food log inserted with ID: ${this.lastID}`);
      callback(null, this.lastID); // Callback with the new food log ID
    }
  });
  stmt.finalize();
}





// Function to get food logs for a specific user
function getFoodLogs(user_id, callback) {
  db.all("SELECT * FROM food_logs WHERE user_id = ?", [user_id], (err, rows) => {
    if (err) {
      console.error('Error retrieving food logs: ' + err.message);
      callback(err);
    } else {
      callback(null, rows); // Returns all food logs for the user
    }
  });
}




// Function to get daily totals for a specific user and date
function getDailyTotals(user_id, date, callback) {
    const sql = `
      SELECT 
        SUM(calories) AS totalCalories, 
        SUM(carbs) AS totalCarbs, 
        SUM(protein) AS totalProtein, 
        SUM(fats) AS totalFats
      FROM food_logs 
      WHERE user_id = ? AND date = ?
    `;
    db.get(sql, [user_id, date], (err, row) => {
      if (err) {
        console.error('Error retrieving daily totals: ' + err.message);
        callback(err);
      } else {
        callback(null, row);
      }
    });
  }






  // Function to get 7-day averages ending at a given date for a user
function getSevenDayAverages(user_id, endDate, callback) {
    // Calculate the date 6 days before the given endDate (assuming format YYYY-MM-DD)
    const startDateObj = new Date(endDate);
    startDateObj.setDate(startDateObj.getDate() - 6);
    const startDate = startDateObj.toISOString().split('T')[0];
  
    // This subquery groups food logs by date then averages the daily sums
    const sql = `
      SELECT 
        AVG(totalCalories) AS avgCalories, 
        AVG(totalCarbs) AS avgCarbs, 
        AVG(totalProtein) AS avgProtein, 
        AVG(totalFats) AS avgFats
      FROM (
        SELECT 
          date, 
          SUM(calories) AS totalCalories, 
          SUM(carbs) AS totalCarbs, 
          SUM(protein) AS totalProtein, 
          SUM(fats) AS totalFats
        FROM food_logs
        WHERE user_id = ? AND date BETWEEN ? AND ?
        GROUP BY date
      )`;
    
    db.get(sql, [user_id, startDate, endDate], (err, row) => {
      if (err) {
        console.error('Error retrieving 7-day averages: ' + err.message);
        callback(err);
      } else {
        callback(null, row);
      }
    });
  }




  function deleteFoodLog(logId, callback) {
    const sql = "DELETE FROM food_logs WHERE id = ?";
    db.run(sql, [logId], function(err) {
      if (err) return callback(err);
      callback(null, { changes: this.changes });
    });
  }
  
  



  function updateUserProfile(user_id, age, height, current_weight, goal_weight, activity_level, 
    gender, dailyCalories, carbs, protein, fat, goal_type, custom_calories, custom_carbs, 
    custom_protein, custom_fat, callback) {
    
    const sql = `UPDATE users SET 
      age=?, height=?, current_weight=?, goal_weight=?, activity_level=?, gender=?,
      daily_calories=?, carbs=?, protein=?, fat=?, 
      goal_type=?, custom_calories=?, custom_carbs=?, custom_protein=?, custom_fat=?
      WHERE user_id=?`;
  
    db.run(sql, [
      age, height, current_weight, goal_weight, activity_level, gender,
      dailyCalories, carbs, protein, fat,
      goal_type, custom_calories, custom_carbs, custom_protein, custom_fat,
      user_id
    ], callback);
  }
  



db.run(`CREATE TABLE IF NOT EXISTS weight_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  date TEXT NOT NULL,
  weight REAL,
  FOREIGN KEY(user_id) REFERENCES users(user_id)
)`, (err) => {
  if (err) console.error('Error creating weight_logs:', err.message);
  else console.log('Weight logs table created');
});



function insertWeightLog(user_id, date, weight, callback) {
  const sql = `INSERT INTO weight_logs (user_id, date, weight) VALUES (?, ?, ?)`;
  db.run(sql, [user_id, date, weight], function(err) {
    if (err) {
      console.error('Error inserting weight log:', err.message);
      return callback(err);
    }
    callback(null, this.lastID);
  });
}

function getWeightLogs(user_id, callback) {
  const sql = `SELECT * FROM weight_logs WHERE user_id = ? ORDER BY date`;
  db.all(sql, [user_id], (err, rows) => callback(err, rows));
}





// Create water_logs table
db.run(`CREATE TABLE IF NOT EXISTS water_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  date TEXT NOT NULL,
  amount INTEGER,
  FOREIGN KEY(user_id) REFERENCES users(user_id)
)`, (err) => {
  if (err) console.error('Error creating water_logs:', err.message);
  else console.log('Water logs table created');
});




db.run(`CREATE TABLE IF NOT EXISTS user_foods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  calories REAL NOT NULL,
  carbs REAL NOT NULL,
  protein REAL NOT NULL,
  fats REAL NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(user_id)
)`, (err) => {
  if (err) {
    console.error('Error creating user_foods table:', err.message);
  } else {
    console.log('User foods table created or exists');
  }
});






  
  module.exports = {
    db,
    registerUser,
    findUserByUsername,
    insertFoodLog,
    getFoodLogs,
    updateUserProfile,
    getDailyTotals,
    getSevenDayAverages,
    deleteFoodLog ,
    insertWeightLog,
    getWeightLogs
  };