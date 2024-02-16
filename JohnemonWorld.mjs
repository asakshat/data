import JohnemonArena from './JohnemonArena.mjs';
import { menuScreen } from './Game.mjs';
import { executeQuery } from './database.mjs';

class JohnemonWorld {
	constructor() {
		this.day = 0;
		this.logs = [];
	}

	async oneDayPasses(playerMaster) {
		this.day++;
		console.log(`Day ${this.day}`);
		const selID = await executeQuery(
			`select id from JohnemonMaster where name = ?`,
			playerMaster.name
		);
		const insertQuery = `UPDATE World SET days_passed=? WHERE player_id =?`;
		await executeQuery(insertQuery, [this.day, selID[0].id]);
		console.log('World data saved successfully.');
		await this.randomizeEvent(playerMaster);
	}

	async randomizeEvent(playerMaster) {
		let arena = new JohnemonArena();
		let random = Math.trunc(Math.random() * 2);

		if (random === 0) {
			console.log('Your day went by without an encounter');
			await menuScreen();
		} else if (random === 1) {
			await arena.startBattle(playerMaster);
		} else {
			console.log(Chalk.red('Error'));
		}
	}

	async addLog(newLog) {
		console.log(newLog);
		this.logs.push(newLog);
	}
}

export default JohnemonWorld;
