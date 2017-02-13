import math from './math';

export default {
	/**
	 * Calculate hit chance between 0.1 and 1.0.
	 * 
	 * @param {Creature} sender The creature attempting to hit something.
	 * @param {Creature} receiver The creature being hit.
	 * 
	 * @return {Number}
	 */
	getHitChance(sender, receiver) {
		// The percentage difference between half the sender's accuracy and the receiver's total
		// evason. This gives a 50% chance for matching accuracy and evasion and a 100% chance for
		// anything equal to or over double accuracy.
		return math.clamp((sender.stats.accuracy / 2) / receiver.stats.evasion, 0.1, 1.0);
	}
};