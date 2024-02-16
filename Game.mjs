// `npm install` before playing
import inquirer from 'inquirer';
import gradient from 'gradient-string';
import figlet from 'figlet';
import chalk from 'chalk';
import { createSpinner } from 'nanospinner';

import Johnemon from './Johnemon.mjs';
import JohnemonMaster from './JohnemonMaster.mjs';
import JohnemonWorld from './JohnemonWorld.mjs';
import { executeQuery, createDatabaseAndTables } from './database.mjs';

const playerMaster = new JohnemonMaster();
let world1 = new JohnemonWorld(playerMaster);

async function askForName() {
	await sleep(1000);
	const answers = await inquirer.prompt({
		name: 'player_name',
		type: 'input',
		message: 'Enter player name:\n',
	});
	const playerName = answers.player_name;

	// Check if the name already exists
	const nameExistsQuery = `SELECT * FROM JohnemonMaster WHERE name = ?`;
	const nameExistsResult = await executeQuery(nameExistsQuery, playerName);

	if (nameExistsResult.length > 0) {
		console.log(
			chalk.red(
				`Sorry, the name "${playerName}" is already in use. Please choose a different name.`
			)
		);
		await askForName();
	} else {
		playerMaster.name = playerName;
		console.log(
			`${chalk.green(
				`Welcome, ${chalk.blue(
					`${playerMaster.name}`
				)}! Good luck in your adventure.`
			)}`
		);
		const johnemonMasterValues = [
			playerMaster.name,
			playerMaster.healingItems,
			playerMaster.reviveItems,
			playerMaster.JOHNEBALLS,
		];
		const johnemonMasterInsert = `
            INSERT INTO JohnemonMaster (name, healingItems, reviveItems, JOHNEBALLS)
            VALUES (?, ?, ?, ?)
        `;
		const playerInsert = await executeQuery(
			johnemonMasterInsert,
			johnemonMasterValues
		);
		const player_id = playerInsert.insertId;

		await executeQuery(
			`INSERT INTO World (player_id,days_passed) VALUES (?,?)`,
			[player_id, world1.day]
		);
		console.log('World data saved successfully.');

		await sleep(500);
		await proposeFirstJohnemon(player_id);
		await sleep(1000);
		await menuScreen();
	}
}

export const sleep = (ms = 1000) => new Promise((r) => setTimeout(r, ms));

export async function johnemonFunctions() {
	const choices = await playerMaster.showCollections();

	choices.push('Go back');

	const answers = await inquirer.prompt({
		name: 'selectedJohnemon',
		type: 'list',
		message: 'Choose a Johnemon to perform an action:',
		choices: choices,
	});
	if (answers.selectedJohnemon === 'Go back') {
		await menuScreen();
		return;
	}

	const selectedJohnemon = playerMaster.johnemonCollection.find(
		(johnemon) => johnemon.name === answers.selectedJohnemon
	);

	if (selectedJohnemon) {
		const actionAnswers = await inquirer.prompt({
			name: 'actionChoice',
			type: 'list',
			message: 'Choose an action for: ' + chalk.magenta(selectedJohnemon.name),
			choices: ['Heal', 'Revive', 'Rename', 'Release', 'Go back'],
		});
		const selectedJohnemonIdResult = await executeQuery(
			`SELECT id FROM Johnemon WHERE name = ?`,
			selectedJohnemon.name
		);
		const selectedJohnemonId = selectedJohnemonIdResult[0].id;

		switch (actionAnswers.actionChoice) {
			case 'Heal':
				await playerMaster.healJohnemon(selectedJohnemon, selectedJohnemonId);
				break;
			case 'Revive':
				await playerMaster.reviveJohnemon(selectedJohnemon, selectedJohnemonId);
				break;
			case 'Rename':
				await playerMaster.renameJohnemon(selectedJohnemon, selectedJohnemonId);
				break;
			case 'Release':
				await playerMaster.releaseJohnemon(
					selectedJohnemon,
					selectedJohnemonId
				);
				break;
			case 'Go back':
				await menuScreen();
				return;
			default:
				break;
		}
		await johnemonFunctions();
	}
}

export async function menuScreen() {
	await sleep(1000);

	const itemsArray = [
		{
			name: 'Healing Items',
			key: 'healingItems',
			value: playerMaster.healingItems,
		},
		{
			name: 'Revive Items',
			key: 'reviveItems',
			value: playerMaster.reviveItems,
		},
		{
			name: 'JohnemonBalls',
			key: 'JOHNEBALLS',
			value: playerMaster.JOHNEBALLS,
		},
	];

	const itemChoices = itemsArray.map((item) => item.name);

	const answers = await inquirer.prompt({
		name: 'menuChoice',
		type: 'list',
		message: `Select Options:  (${chalk.blue(playerMaster.name)})     `,
		choices: [
			'Start exploring',
			'Your Johnemons',
			'Item shop',
			'Quit (changes are autosaved to the database)',
		],
	});

	if (answers.menuChoice === 'Your Johnemons') {
		console.log('Your Johnemons:');
		await johnemonFunctions();
	} else if (answers.menuChoice === 'Item shop') {
		const itemAnswer = await inquirer.prompt({
			name: 'selectedItem',
			type: 'list',
			message: 'Choose an item to buy:',
			choices: itemChoices,
		});

		const selectedItem = itemsArray.find(
			(item) => item.name === itemAnswer.selectedItem
		);

		if (selectedItem) {
			const quantityAnswer = await inquirer.prompt({
				name: 'quantity',
				type: 'number',
				message: `Enter the quantity of ${selectedItem.name} to buy (current: ${selectedItem.value}): `,
				default: selectedItem.value,
			});
			playerMaster[selectedItem.key] += quantityAnswer.quantity;
			await executeQuery(
				`UPDATE JohnemonMaster SET ${selectedItem.key} = ${
					playerMaster[selectedItem.key]
				} where name = '${playerMaster.name}'`
			);

			console.log(
				chalk.yellow(`
            Your current Items
            - ${selectedItem.name}: ${playerMaster[selectedItem.key]}`)
			);
		}

		await menuScreen();
	} else if (
		answers.menuChoice === 'Quit (changes are autosaved to the database)'
	) {
		process.exit();
	} else if (answers.menuChoice === 'Start exploring') {
		await world1.oneDayPasses(playerMaster);
	}
}

async function welcomeScreen() {
	const msg = `Welcome to JohneMon!`;
	const options = {
		font: 'Doom',
	};

	figlet(msg, options, async (err, data) => {
		console.log(gradient.retro(data));
	});
}

async function home() {
	await sleep(500);
	const answers = await inquirer.prompt({
		name: 'menuChoice',
		type: 'list',
		message: 'Select Options:',
		choices: ['Start New Game', 'Continue Saved', 'Exit'],
	});

	if (answers.menuChoice === 'Start New Game') {
		await askForName();
	} else if (answers.menuChoice === 'Continue Saved') {
		await loadGameState();
		await menuScreen();
	} else if (answers.menuChoice === 'Exit') {
		process.exit();
	}
}

async function fetchPlayerNames() {
	const playerNamesData = await executeQuery('SELECT name FROM JohnemonMaster');
	return playerNamesData.map((row) => row.name);
}

async function loadGameState() {
	const playerNames = await fetchPlayerNames();
	if (playerNames.length === 0) {
		console.log('No player names found in the database.');
		return null;
	}
	const answers = await inquirer.prompt({
		name: 'playerName',
		type: 'list',
		message: 'As which player would you like to continue? :',
		choices: playerNames,
	});
	const selectedPlayer = answers.playerName;

	const johnemonMasterData = await executeQuery(
		`SELECT * FROM JohnemonMaster WHERE name =?`,
		selectedPlayer
	);

	const savedData = johnemonMasterData[0];
	playerMaster.name = savedData.name;
	playerMaster.healingItems = savedData.healingItems;
	playerMaster.reviveItems = savedData.reviveItems;
	playerMaster.JOHNEBALLS = savedData.JOHNEBALLS;

	const johnemonData = await executeQuery(
		`SELECT * FROM Johnemon WHERE player_id = ?`,
		savedData.id
	);

	for (const johnemonRow of johnemonData) {
		const johnemon = new Johnemon();
		johnemon.name = johnemonRow.name;
		johnemon.level = johnemonRow.level;
		johnemon.experienceMeter = johnemonRow.experienceMeter;
		johnemon.attackRange = johnemonRow.attackRange;
		johnemon.defenseRange = johnemonRow.defenseRange;
		johnemon.healthPool = johnemonRow.healthPool;
		johnemon.catchPhrase = johnemonRow.catchPhrase;
		johnemon.currentHealth = johnemonRow.currentHealth;

		const skillsData = await executeQuery(
			`SELECT * FROM Skill WHERE johnemon_id = ?`,
			johnemonRow.id
		);

		johnemon.skills = skillsData.map((skill) => ({
			name: skill.name,
			damageRange: skill.damage,
		}));

		playerMaster.johnemonCollection.push(johnemon);
	}

	console.log(
		chalk.green(`Game Loaded as ${chalk.blue(`(${selectedPlayer})`)}`)
	);
}

async function proposeFirstJohnemon(player_id) {
	await sleep(500);
	const johne1 = new Johnemon();
	const johne2 = new Johnemon();
	const johne3 = new Johnemon();
	const choices = [
		{
			name: `Name: ${johne1.name}, Skills: [${johne1.skills
				.map((skill) => skill.name)
				.join(', ')}], Health Pool: ${johne1.healthPool}`,
			value: johne1,
		},
		{
			name: `Name: ${johne2.name}, Skills: [${johne2.skills
				.map((skill) => skill.name)
				.join(', ')}], Health Pool: ${johne2.healthPool}`,
			value: johne2,
		},
		{
			name: `Name: ${johne3.name}, Skills: [${johne3.skills
				.map((skill) => skill.name)
				.join(', ')}], Health Pool: ${johne3.healthPool}`,
			value: johne3,
		},
	];

	const answers = await inquirer.prompt({
		name: 'chooseJohnemon',
		type: 'list',
		message: 'Choose starting Johnemon:',
		choices: choices,
	});
	const chosenJohnemon = answers.chooseJohnemon;
	playerMaster.johnemonCollection.push(chosenJohnemon);

	const johnemonValues = [
		player_id,
		chosenJohnemon.name,
		chosenJohnemon.level,
		chosenJohnemon.experienceMeter,
		chosenJohnemon.attackRange,
		chosenJohnemon.defenseRange,
		chosenJohnemon.healthPool,
		chosenJohnemon.catchPhrase,
		chosenJohnemon.currentHealth,
	];

	const johnemonInsert =
		'INSERT INTO Johnemon (player_id,name,level,experienceMeter,attackRange,defenseRange,healthPool,catchPhrase,currentHealth) VALUES (?,?,?,?,?,?,?,?,?)';
	const johnemonInsertResult = await executeQuery(
		johnemonInsert,
		johnemonValues
	);
	const johnemonID = johnemonInsertResult.insertId;
	for (const skill of chosenJohnemon.skills) {
		await executeQuery(
			'INSERT INTO Skill (johnemon_id, name, damage) VALUES (?, ?, ?)',
			[johnemonID, skill.name, skill.damageRange]
		);
	}
	const spinner = createSpinner('....').start();
	await sleep(500);
	spinner.success({
		text: `Nice, ${chalk.blue(playerMaster.name)}! You chose ${chalk.magenta(
			chosenJohnemon.name
		)}!`,
	});
}

async function startGame() {
	console.clear();
	await createDatabaseAndTables();
	await welcomeScreen();
	await home();
	await world1.oneDayPasses();
}
startGame();
export default { playerMaster, sleep };
