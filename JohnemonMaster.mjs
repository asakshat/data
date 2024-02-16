import inquirer from 'inquirer';
import chalk from 'chalk';
import { executeQuery } from './database.mjs';

class JohnemonMaster {
	constructor(name) {
		this.name = name;
		this.johnemonCollection = [];
		this.healingItems = 5; // Initial number of healing items
		this.reviveItems = 3; // Initial number of revive items
		this.JOHNEBALLS = 10; // Initial number of JOHNEBALLS
	}

	async renameJohnemon(johnemon, selectedJohnemonId) {
		const { newName } = await inquirer.prompt({
			name: 'newName',
			type: 'input',
			message: `Enter a new name for ${chalk.magenta(johnemon.name)}:`,
		});
		let oldName = johnemon.name;
		johnemon.name = newName;
		await executeQuery('UPDATE Johnemon SET name = ? WHERE id = ?', [
			newName,
			selectedJohnemonId,
		]);
		console.log(
			chalk.green(
				`-Your ${chalk.magenta(
					`${oldName}`
				)} has been renamed to ${chalk.magenta(`${newName}`)}.`
			)
		);
	}

	async healJohnemon(johnemon, selectedJohnemonId) {
		if (
			this.healingItems >= 1 &&
			johnemon.currentHealth < johnemon.healthPool &&
			johnemon.currentHealth >= 1
		) {
			johnemon.currentHealth = johnemon.healthPool;
			await executeQuery(`UPDATE Johnemon SET currentHealth = ? WHERE id = ?`, [
				johnemon.healthPool,
				selectedJohnemonId,
			]);
			this.healingItems--;
			console.log(
				chalk.green(
					`- ${chalk.magenta(`${johnemon.name}`)} is healed to max hp.`
				)
			);
		} else if (johnemon.healingItems < 1) {
			console.log(chalk.red(`- No health potions left. :(`));
		} else if (johnemon.currentHealth === johnemon.healthPool) {
			console.log(
				chalk.red(
					`- Your ${chalk.magenta(`${johnemon.name}`)}'s hp is already full`
				)
			);
		} else {
			console.log(
				chalk.red(
					`- Your ${chalk.magenta(
						`${johnemon.name}`
					)} is dead. Use revive potion first!`
				)
			);
		}
	}

	async reviveJohnemon(johnemon, selectedJohnemonId) {
		console.log('reviveItems:', this.reviveItems);
		if (this.reviveItems >= 1 && johnemon.currentHealth <= 0) {
			// Revive the Johnemon to half health
			johnemon.currentHealth = johnemon.healthPool / 2;
			await executeQuery(`UPDATE Johnemon SET curretHealth = ? WHERE id = ?`, [
				johnemon.healthPool / 2,
				selectedJohnemonId,
			]);
			this.reviveItems--;
			console.log(
				chalk.green(
					`- ${chalk.magenta(`${johnemon.name}`)} revived to half health`
				)
			);
		} else if (johnemon.currentHealth > 0) {
			console.log(
				chalk.red(
					`- ${chalk.magenta(
						`${johnemon.name}`
					)} is not dead, no need to revive`
				)
			);
		} else if (this.reviveItems <= 0) {
			console.log(chalk.red(`No revive potions left`));
		} else {
			console.log(`error`);
		}
	}

	async releaseJohnemon(johnemon, selectedJohnemonId) {
		const index = this.johnemonCollection.indexOf(johnemon);
		if (index !== -1 && this.johnemonCollection.length > 1) {
			this.johnemonCollection.splice(index, 1);
			await executeQuery(
				`DELETE FROM Skill WHERE johnemon_id = ?`,
				selectedJohnemonId
			);
			await executeQuery(
				`DELETE FROM Johnemon WHERE id = ?`,
				selectedJohnemonId
			);
			console.log(chalk.green(`- Released ${johnemon.name}.`));
		} else if (this.johnemonCollection.length <= 1) {
			console.log(
				chalk.red(`- Can't release because you only have 1 Johnemon left.`)
			);
		} else {
			console.clear();
			console.log(chalk.red(`- Unable to release.`));
		}
	}

	async showCollections() {
		const choices = this.johnemonCollection.map((johnemon) => johnemon.name);
		return choices;
	}

	calcCatch(johnemon) {
		const healthPercentage =
			(johnemon.currentHealth / johnemon.healthPool) * 100;
		const baseCatchChance = 0.3;
		const additionalChance = 0.01 * (100 - healthPercentage);

		return Math.min(baseCatchChance + additionalChance, 1.0);
	}
}
export default JohnemonMaster;
