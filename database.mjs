import mysql from 'mysql';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
	connectionLimit: 10,
	host: 'localhost',
	user: 'root',
	password: process.env.DB_PASSWORD,
});

pool.on('connection', (connection) => {});

export async function executeQuery(query, values) {
	return new Promise((resolve, reject) => {
		pool.query(query, values, (error, results) => {
			if (error) {
				reject(error);
			} else {
				resolve(results);
			}
		});
	});
}

export async function createDatabaseAndTables() {
	const createTableQueries = [
		`CREATE DATABASE IF NOT EXISTS JohnemonGame
        `,
		`USE JohnemonGame`,
		`CREATE TABLE IF NOT EXISTS JohnemonMaster (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            healingItems INT NOT NULL,
            reviveItems INT NOT NULL,
            JOHNEBALLS INT NOT NULL
        )`,
		`CREATE TABLE IF NOT EXISTS Johnemon (
            id INT AUTO_INCREMENT PRIMARY KEY,
            player_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            level INT NOT NULL,
            experienceMeter INT NOT NULL,
            attackRange INT NOT NULL,
            defenseRange INT NOT NULL,
            healthPool INT NOT NULL,
            catchPhrase VARCHAR(255) NOT NULL,
            currentHealth INT NOT NULL,
            FOREIGN KEY (player_id) REFERENCES JohnemonMaster(id)
        )`,
		`CREATE TABLE IF NOT EXISTS Skill (
            id INT AUTO_INCREMENT PRIMARY KEY,
            johnemon_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            damage INT NOT NULL,
            FOREIGN KEY (johnemon_id) REFERENCES Johnemon(id)
        )`,
		`CREATE TABLE IF NOT EXISTS World (
            id INT AUTO_INCREMENT PRIMARY KEY,
            player_id INT NOT NULL,
            days_passed INT NOT NULL DEFAULT 0,
            saved_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (player_id) REFERENCES JohnemonMaster(id)
        )`,
		`CREATE TABLE IF NOT EXISTS Battle (
            id INT AUTO_INCREMENT PRIMARY KEY,
            player_id INT NOT NULL,
            johnemon_id INT NOT NULL,
            result ENUM('win', 'loss') NOT NULL,
            FOREIGN KEY (player_id) REFERENCES JohnemonMaster(id),
            FOREIGN KEY (johnemon_id) REFERENCES Johnemon(id)
        )`,
	];

	const addSampleData = [
		`INSERT INTO JohnemonMaster (name, healingItems, reviveItems, JOHNEBALLS) VALUES ('Ash', 5, 6, 7)`,
		`INSERT INTO JohnemonMaster (name, healingItems, reviveItems, JOHNEBALLS) VALUES ('Brock', 6, 5, 9)`,
		`INSERT INTO Johnemon (player_id,name,level,experienceMeter,attackRange,defenseRange,healthPool,catchPhrase,currentHealth) VALUES (1,'Pikachu', 0, 0, 5,8,25,'I choose you!',25)`,
		`INSERT INTO Johnemon (player_id,name,level,experienceMeter,attackRange,defenseRange,healthPool,catchPhrase,currentHealth) VALUES (2,'Meowth', 0, 0, 6,8,28,'I choose you!',28)`,
		`INSERT INTO Skill (johnemon_id,name,damage) VALUES (1,'TailWhip',11)`,
		`INSERT INTO Skill (johnemon_id,name,damage) VALUES (1,'Whirlwind',4)`,
		`INSERT INTO Skill (johnemon_id,name,damage) VALUES (1,'Rock Slide',6)`,
		`INSERT INTO Skill (johnemon_id,name,damage) VALUES (1,'Surf',9)`,
		`INSERT INTO Skill (johnemon_id,name,damage) VALUES (2,'Bite',9)`,
		`INSERT INTO Skill (johnemon_id,name,damage) VALUES (2,'Hit',13)`,
		`INSERT INTO Skill (johnemon_id,name,damage) VALUES (2,'Dash',6)`,
		`INSERT INTO Skill (johnemon_id,name,damage) VALUES (2,'Dizzy Punch',3)`,
		`INSERT INTO Battle (player_id,johnemon_id,result) VALUES (1,1,'win')`,
		`INSERT INTO Battle (player_id,johnemon_id,result) VALUES (2,2,'loss')`,
		`INSERT INTO World (player_id,days_passed) VALUES (1,2)`,
		`INSERT INTO World (player_id,days_passed) VALUES (2,3)`,
	];

	try {
		for (const query of createTableQueries) {
			await executeQuery(query);
		}

		const rowCountResult = await executeQuery(
			'SELECT COUNT(*) AS count FROM JohnemonMaster'
		);

		if (rowCountResult && rowCountResult.length > 0) {
			const rowCount = rowCountResult[0].count;
			if (rowCount === 0) {
				for (const query of addSampleData) {
					await executeQuery(query);
				}
			}
		}
	} catch (error) {
		console.error('Error:', error);
	}
}
