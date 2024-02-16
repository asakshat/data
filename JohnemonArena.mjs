import inquirer from 'inquirer';
import Johnemon from './Johnemon.mjs';
import { menuScreen, sleep } from './Game.mjs';
import chalk from 'chalk';
import { executeQuery } from './database.mjs';

class JohnemonArena {
	constructor() {
		this.johnemon_2 = new Johnemon();
	}

	async startBattle(playerMaster) {
		console.log(`
		A wild Johnemon Appears.\n`);
		const answers = await inquirer.prompt({
			name: 'option',
			type: 'list',
			message: 'Do you want to fight or run ?\n',
			choices: ['Fight', 'Run'],
		});

		if (answers.option === 'Fight') {
			await this.chooseJohnemon(playerMaster);
		} else {
			this.endBattle(selectedJohnemon);
		}
	}

	async chooseJohnemon(playerMaster) {
		const choices = playerMaster.johnemonCollection.map(
			(johnemon) => johnemon.name
		);
		const answers = await inquirer.prompt({
			name: 'choose',
			type: 'list',
			message: 'Choose a Johnemon to fight with.',
			choices: choices,
		});

		const selectedJohnemon = playerMaster.johnemonCollection.find(
			(johnemon) => johnemon.name === answers.choose
		);

		if (selectedJohnemon) {
			await this.startRound(playerMaster, selectedJohnemon);
		}
	}

	async startRound(playerMaster, selectedJohnemon) {
		console.log(chalk.green(selectedJohnemon.generateCatchPhrase()));

		this.johnemon_2.attackRange += selectedJohnemon.level * 2;
		this.johnemon_2.defenseRange += selectedJohnemon.level * 2;
		this.johnemon_2.healthPool += selectedJohnemon.level * 1.5;
		console.log(
			`Enemy ${chalk.magenta(this.johnemon_2.name)}: Attack ${
				this.johnemon_2.attackRange
			}, Defense ${this.johnemon_2.defenseRange}`
		);

		await this.playerAction(playerMaster, selectedJohnemon);
	}

	async playerAction(playerMaster, selectedJohnemon) {
		const playerChoice = await inquirer.prompt({
			name: 'action',
			type: 'list',
			message: 'Choose an action:',
			choices: ['Attack', 'Try to Catch'],
		});

		if (playerChoice.action === 'Attack') {
			await this.chooseSkills(playerMaster, selectedJohnemon);
		} else if (playerChoice.action === 'Try to Catch') {
			await this.tryToCatch(playerMaster, selectedJohnemon);
		}
	}

	async chooseSkills(playerMaster, selectedJohnemon) {
		const choicesWithDamageRange = selectedJohnemon.skills.map((skill) => ({
			name: `${skill.name} - Damage: ${skill.damageRange}`,
			value: skill.name,
		}));
		const answers = await inquirer.prompt({
			name: 'skill',
			type: 'list',
			message: 'Choose an attack:',
			choices: choicesWithDamageRange,
		});

		const selectedAttack = selectedJohnemon.skills.find(
			(skill) => skill.name === answers.skill
		);

		if (selectedAttack) {
			await this.attack(
				playerMaster,
				selectedJohnemon,
				selectedAttack.damageRange
			);
		}
	}

	async attack(playerMaster, selectedJohnemon, selectedAttack) {
		const playerDamage = this.calculateDamage(
			selectedAttack,
			this.johnemon_2.defenseRange
		);

		this.johnemon_2.currentHealth -= playerDamage;
		console.log(chalk.yellow(`----------------------------------------`));
		console.log(`You dealt ${playerDamage} damage to ${this.johnemon_2.name}.`);
		await sleep(500);
		console.log(
			`${this.johnemon_2.name} current health is ${this.johnemon_2.currentHealth}`
		);
		await sleep(500);
		await this.checkBattleStatus(selectedJohnemon, playerMaster);
		await this.wildJohnemonAction(playerMaster, selectedJohnemon);
	}

	async tryToCatch(playerMaster, selectedJohnemon) {
		console.log('Trying to catch the wild Johnemon...');

		if (this.johnemon_2.currentHealth < 10) {
			await sleep(500);
			console.log(
				`Congratulations! You caught ${this.johnemon_2.name}. It is now added to your collection.`
			);
			playerMaster.johnemonCollection.push(this.johnemon_2);
			const playerIDReuslt = await executeQuery(
				`SELECT id FROM JohnemonMaster Where name = ?`,
				playerMaster.name
			);
			const playerID = playerIDReuslt[0].id;
			const johnemonValues = [
				playerID,
				this.johnemon_2.name,
				this.johnemon_2.level,
				this.johnemon_2.experienceMeter,
				this.johnemon_2.attackRange,
				this.johnemon_2.defenseRange,
				this.johnemon_2.healthPool,
				this.johnemon_2.catchPhrase,
				this.johnemon_2.currentHealth,
			];

			const johnemonInsert =
				'INSERT INTO Johnemon (player_id,name,level,experienceMeter,attackRange,defenseRange,healthPool,catchPhrase,currentHealth) VALUES (?,?,?,?,?,?,?,?,?)';
			const johnemonInsertResult = await executeQuery(
				johnemonInsert,
				johnemonValues
			);
			const johnemonID = johnemonInsertResult.insertId; // getting ID for saved value of the chosen johnemon
			for (const skill of this.johnemon_2.skills) {
				await executeQuery(
					'INSERT INTO Skill (johnemon_id, name, damage) VALUES (?, ?, ?)',
					[johnemonID, skill.name, skill.damageRange]
				);
			}
			await this.endBattle();
		} else {
			await sleep(500);

			console.log(`${this.johnemon_2.name} escaped. Continue...`);
			await this.wildJohnemonAction(playerMaster, selectedJohnemon);
		}
	}

	async wildJohnemonAction(playerMaster, selectedJohnemon) {
		console.log(chalk.yellow(`----------------------------------------`));
		await sleep(500);
		console.log(`${this.johnemon_2.name} attacks!`);

		const wildDamage = this.calculateDamage(
			this.johnemon_2.attackRange,
			selectedJohnemon.defenseRange
		);

		selectedJohnemon.currentHealth -= wildDamage;
		await sleep(500);

		console.log(
			`${this.johnemon_2.name} dealt ${wildDamage} damage to ${selectedJohnemon.name}.`
		);
		await sleep(500);

		console.log(
			`Your ${selectedJohnemon.name}'s health is ${selectedJohnemon.currentHealth}`
		);
		console.log(chalk.yellow(`----------------------------------------`));
		await sleep(500);

		await this.checkBattleStatus(selectedJohnemon, playerMaster);
		await this.startNewRound(playerMaster, selectedJohnemon);
	}

	calculateDamage(attackRange, defenseRange) {
		return Math.max(0, attackRange - defenseRange);
	}

	async checkBattleStatus(selectedJohnemon, playerMaster) {
		const selectJohnemonID = await executeQuery(
			`Select id FROM Johnemon WHERE name = ?`,
			selectedJohnemon.name
		);
		const selectPlayerID = await executeQuery(
			`Select id FROM JohnemonMaster WHERE name = ?`,
			playerMaster.name
		);
		const selectJohnemonIDResult = selectJohnemonID[0].id;
		const playerMasterID = selectPlayerID[0].id;

		if (selectedJohnemon.currentHealth < 1) {
			console.log(`${selectedJohnemon.name} fainted! You lost the battle.`);
			await executeQuery(
				`INSERT INTO Battle (player_id,johnemon_id,result) VALUES (?,?,?)`,
				[playerMasterID, selectJohnemonIDResult, 'loss']
			);
			await this.endBattle(selectedJohnemon);
		} else if (this.johnemon_2.currentHealth < 1) {
			console.log(`${this.johnemon_2.name} fainted! You won the battle.`);
			await selectedJohnemon.gainExperience(this.johnemon_2.level);
			await executeQuery(
				`INSERT INTO Battle (player_id,johnemon_id,result) VALUES (?,?,?)`,
				[playerMasterID, selectJohnemonIDResult, 'win']
			);
			await this.endBattle(selectedJohnemon);
		}
	}

	async startNewRound(playerMaster, selectedJohnemon) {
		await this.playerAction(playerMaster, selectedJohnemon);
	}

	async endBattle(selectedJohnemon) {
		console.log('The battle has ended.');
		console.log(chalk.yellow(`----------------------------------------`));
		sleep(1000);
		await menuScreen();
	}
}

export default JohnemonArena;
