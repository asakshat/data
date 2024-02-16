import { executeQuery } from './database.mjs';

const students = [
	'Saks',
	'hat',
	'Thie',
	'rry',
	'Art',
	'hur',
	'Nou',
	'héila',
	'Yor',
	'die',
	'Si',
	'mon',
	'Nico',
	'las',
	'Alex',
	'andre',
	'Piet',
	'ro',
	'Ele',
	'na',
	'Jo',
	'ao',
	'Liv',
	'iu',
	'My',
	'riam',
	'Jor',
	'dan',
	'In',
	'na',
	'Haz',
	'ar',
	'Arg',
	'jent',
	'Antoi',
	'ne-Alexandr',
	'Ari',
	'anne',
	'Khy',
	'ati',
	'Den',
	'is',
	'Yul',
	'iia',
	'Do',
	'ra',
	'Jun',
	'ior',
	'Jessi',
	'ca',
	'Yav',
	'anna',
	'Lou',
	'ise',
	'Lí',
	'lia',
	'Jor',
	'ina',
	'Via',
	'cheslav',
	'Zach',
	'arie',
	'O',
	'leg',
];
const attacks = [
	'Thundershock',
	'Tailwhip',
	'Dash',
	'Slice',
	'Cut',
	'Burn',
	'Roar',
	'Hit',
	'Bite',
	'Beam',
	'Dizzy Punch',
	'Rolling Kick',
	'Whirlwind',
	'Tackle',
	'Surf',
	'Stomp',
	'Rock Throw',
	'Rock Slide',
];

class Johnemon {
	constructor() {
		this.name = this.generateRandomName();
		this.level = 1;
		this.experienceMeter = 0;
		this.skills = this.generateRandomSkills();
		this.attackRange = this.getRandomNumber(1, 8);
		this.defenseRange = this.getRandomNumber(1, 3);
		this.healthPool = this.getRandomNumber(10, 30);
		this.catchPhrase = this.generateCatchPhrase();
		this.currentHealth = this.healthPool;
	}

	generateRandomName() {
		const randomStudent1 =
			students[Math.floor(Math.random() * students.length)];
		const randomStudent2 =
			students[Math.floor(Math.random() * students.length)];
		return `${randomStudent1}${randomStudent2}`;
	}

	getRandomNumber(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	generateCatchPhrase() {
		const phrases = ['I choose you!', 'Let the battle begin!', 'Johnemon, go!'];
		return phrases[Math.floor(Math.random() * phrases.length)];
	}
	generateRandomSkills() {
		const numberOfSkills = 4;
		const selectedSkills = [];

		for (let i = 0; i < numberOfSkills; i++) {
			const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
			selectedSkills.push({
				name: randomAttack,
				damageRange: this.getRandomNumber(5, 10),
			});
		}

		return selectedSkills;
	}
	attack(defender) {
		const damage =
			this.getRandomNumber(this.attackRange * this.level, this.attackRange) -
			defender.defenseRange;
		defender.healthPool -= damage;
		console.log(
			`${this.name} attacked ${defender.name} and dealt ${damage} damage!`
		);
	}

	async gainExperience(opponentLevel) {
		const experienceGain = this.getRandomNumber(1, 5) * opponentLevel;
		this.experienceMeter += experienceGain;
		await executeQuery(`UPDATE Johnemon SET experienceMeter = ? where name=?`, [
			this.experienceMeter,
			this.name,
		]);
		console.log(`${this.name} gained ${experienceGain} experience points!`);
		if (this.experienceMeter >= this.level * 5) {
			await this.evolve();
		}
	}

	async evolve() {
		this.level += 1;
		const defenseIncrease = this.getRandomNumber(1, 5);
		const healthIncrease = this.getRandomNumber(1, 5);
		this.defenseRange += defenseIncrease;
		this.healthPool += healthIncrease;

		await executeQuery(
			`UPDATE Johnemon SET level = ?, defenseRange = ?, healthPool = ? WHERE name = ?`,
			[this.level, this.defenseRange, this.healthPool, this.name]
		);

		const selectJohnemonID = await executeQuery(
			`Select id FROM Johnemon WHERE name = ?`,
			this.name
		);
		const selectJohnemonIDResult = selectJohnemonID[0].id;

		for (const skill of this.skills) {
			const newDamageRange = skill.damageRange + this.getRandomNumber(1, 5);
			skill.damageRange = newDamageRange;

			await executeQuery(
				`UPDATE Skill SET damage = ? WHERE johnemon_id = ? AND name = ?`,
				[newDamageRange, selectJohnemonIDResult, skill.name]
			);
		}
		console.log(
			`${this.name} evolved into a higher level! New stats: Level ${this.level}, Attack Range ${this.attackRange}, Defense Range ${this.defenseRange}, Health Pool ${this.healthPool}`
		);
	}

	sayCatchPhrase() {
		console.log(`${this.name} says: "${this.catchPhrase}"`);
	}
}

export default Johnemon;
