const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

async function main() {
	console.log("🌱 Seeding database...");

	// -----------------------------------------
	// USERS
	// -----------------------------------------
	const hashedPassword = await bcrypt.hash("Pass123!", 10);
	await prisma.user.createMany({
		data: [
			{
				utorid: "cashier01",
				name: "Alice Chen",
				email: "alice.chen@mail.utoronto.ca",
				password: hashedPassword,
				role: "cashier",
				points: 500
			},
			{
				utorid: "manager01",
				name: "Bob Li",
				email: "bob.li@mail.utoronto.ca",
				password: hashedPassword,
				role: "manager",
				points: 1000
			},
			{
				utorid: "super01",
				name: "Admin User",
				email: "admin@mail.utoronto.ca",
				password: hashedPassword,
				role: "superuser",
				points: 5000
			},

			// 7 more regular users
			{
				utorid: "jdoe123",
				name: "John Doe",
				email: "john.doe@mail.utoronto.ca",
				password: hashedPassword,
				points: 2000
			},
			{
				utorid: "msmith",
				name: "Mary Smith",
				email: "mary.smith@mail.utoronto.ca",
				password: hashedPassword,
				points: 5000
			},
			{
				utorid: "kpatel",
				name: "Karan Patel",
				email: "karan.patel@mail.utoronto.ca",
				password: hashedPassword,
				points: 2000
			},
			{
				utorid: "lwang",
				name: "Ling Wang",
				email: "ling.wang@mail.utoronto.ca",
				password: hashedPassword,
				points: 400
			},
			{
				utorid: "dgarcia",
				name: "Daniel Garcia",
				email: "daniel.garcia@mail.utoronto.ca",
				password: hashedPassword,
				points: 6000
			},
			{
				utorid: "tnguyen",
				name: "Trang Nguyen",
				email: "trang.nguyen@mail.utoronto.ca",
				password: hashedPassword,
				points: 1000
			},
			{
				utorid: "csantos",
				name: "Carla Santos",
				email: "carla.santos@mail.utoronto.ca",
				password: hashedPassword,
				points: 200
			}
		]
	});

	const allUsers = await prisma.user.findMany();
	const userIds = allUsers.map((u) => u.id);
	const manager = allUsers.find((u) => u.role === "manager");
	const cashier = allUsers.find((u) => u.role === "cashier");

	// -----------------------------------------
	// EVENTS
	// -----------------------------------------
	const eventsData = Array.from({ length: 5 }).map((_, i) => ({
		name: `Point Earning Event ${i + 1}`,
		description: `A fun point earning event #${i + 1}`,
		location: "Event Centre",
		startTime: new Date(Date.now() + i * 86400000),
		endTime: new Date(Date.now() + i * 86400000 + 7200000),
		capacity: i % 2 === 0 ? 50 : null,
		pointsRemain: 100 + i * 20,
		pointsAwarded: 10 + i * 5,
		published: true
	}));

	await prisma.event.createMany({ data: eventsData });
	const events = await prisma.event.findMany();

	// Assign organizers + guests
	for (const event of events) {
		await prisma.eventOrganizer.create({
			data: {
				userId: manager.id,
				eventId: event.id
			}
		});

		// Add 3 guests to each event
		await prisma.eventGuest.createMany({
			data: userIds.slice(0, 3).map((uid) => ({
				userId: uid,
				eventId: event.id
			}))
		});
	}

	// -----------------------------------------
	// PROMOTIONS
	// -----------------------------------------
	const promotionsData = [
		{
			name: "Welcome Bonus",
			description: "New users get extra points!",
			type: "automatic",
			startTime: new Date(),
			endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
			points: 50
		},
		{
			name: "Holiday Special",
			description: "Earn more during holidays",
			type: "automatic",
			startTime: new Date(),
			endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
			rate: 0.2
		},
		{
			name: "One-Time Boost",
			description: "Single-use promo",
			type: "onetime",
			points: 100,
			startTime: new Date(),
			endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
		},
		{
			name: "Spend & Earn",
			description: "Earn bonus with min spending",
			type: "automatic",
			minSpending: 20,
			rate: 0.1,
			startTime: new Date(),
			endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60)
		},
		{
			name: "Flash Deal",
			description: "Limited-time offer",
			type: "onetime",
			points: 200,
			startTime: new Date(),
			endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
		}
	];
	await prisma.promotion.createMany({ data: promotionsData });

	const promotions = await prisma.promotion.findMany();

	// -----------------------------------------
	// TRANSACTIONS
	// -----------------------------------------
	const transactionTypes = [
		"purchase",
		"redemption",
		"adjustment",
		"event",
		"transfer"
	];

	let transactionsToInsert = [];

	// For reference:
	// users with IDs 1–10 exist
	// events with IDs 1–5 exist

	// First collect all simple transactions, EXCEPT transfer + adjustment
	// (because those require knowledge of other transactions)

	for (let i = 0; i < 30; i++) {
		const userId = userIds[i % userIds.length];
		const type = transactionTypes[i % transactionTypes.length];

		let relatedId = null;
		let createdBy = cashier.id;

		if (type === "event") {
			relatedId = events[i % events.length].id;
		}

		if (type === "redemption") {
			// redemption may or may not have a cashier assigned
			createdBy = userId;
			const assignCashier = Math.random() > 0.3;
			relatedId = assignCashier ? cashier.id : null;
		}

		// Transfers + Adjustments handled later
		if (type === "transfer" || type === "adjustment") continue;

		transactionsToInsert.push({
			userId,
			createdBy,
			type,
			amount: type === "redemption" ? -50 : 64,
			spent: type === "purchase" ? 15.99 : null,
			relatedId,
			remark: `Sample ${type} transaction`
		});
	}

	// ----------------------------------------------
	// INSERT baseline transactions so adjustments can reference them
	// ----------------------------------------------
	await prisma.transaction.createMany({ data: transactionsToInsert });

	let allBaseTransactions = await prisma.transaction.findMany();

	// ----------------------------------------------
	// ADJUSTMENTS (must reference an existing transaction's id)
	// ----------------------------------------------
	let adjustmentTransactions = [];

	for (let i = 0; i < 5; i++) {
		const target = allBaseTransactions[i]; // safe target
		const userId = target.userId;

		adjustmentTransactions.push({
			userId,
			createdBy: cashier.id,
			type: "adjustment",
			amount: Math.random() > 0.5 ? 20 : -20,
			spent: null,
			relatedId: target.id, // RULE: adjustment.targetTransactionId
			remark: `Adjustment for transaction ${target.id}`
		});
	}

	await prisma.transaction.createMany({ data: adjustmentTransactions });

	// ----------------------------------------------
	// TRANSFERS: must create *two* transactions:
	// sender → receiver  and  receiver ← sender
	// relatedId: the other user's ID
	// ----------------------------------------------

	let transferTransactions = [];

	for (let i = 0; i < 5; i++) {
		const sender = userIds[i];
		const receiver = userIds[(i + 1) % userIds.length];

		// sender transaction (points go out)
		transferTransactions.push({
			userId: sender,
			createdBy: cashier.id,
			type: "transfer",
			amount: -25,
			spent: null,
			relatedId: receiver, // RULE: relatedId = other user's ID
			remark: `Transfer sent to user ${receiver}`
		});

		// receiver transaction (points come in)
		transferTransactions.push({
			userId: receiver,
			createdBy: cashier.id,
			type: "transfer",
			amount: 25,
			spent: null,
			relatedId: sender, // RULE: relatedId = other user's ID
			remark: `Transfer received from user ${sender}`
		});
	}

	await prisma.transaction.createMany({ data: transferTransactions });

	// Refresh after all inserts
	const allTransactions = await prisma.transaction.findMany();

	// ----------------------------------------------
	// Attach promotions to 10 random transactions
	// ----------------------------------------------
	for (const t of allTransactions.slice(0, 10)) {
		await prisma.transactionPromotion.create({
			data: {
				transactionId: t.id,
				promotionId: promotions[t.id % promotions.length].id
			}
		});
	}

	// Give 5 users a one-time promo
	for (const uid of userIds.slice(0, 5)) {
		await prisma.userPromotion.create({
			data: {
				userId: uid,
				promotionId: promotions[2].id
			}
		});
	}

	// ------------------------------------------------
	// EXTRA: Add 15 random transactions for userId = 4
	// ------------------------------------------------
	const extraUserId = 4;
	const extraTypes = ["purchase", "redemption", "transfer"];

	let extraTransactions = [];

	for (let i = 0; i < 15; i++) {
		const type = extraTypes[Math.floor(Math.random() * extraTypes.length)];

		let amount = 0;
		let spent = null;
		let relatedId = null;
		let createdBy = cashier.id;

		if (type === "purchase") {
			spent = Number((Math.random() * 30 + 5).toFixed(2));
			amount = Math.floor(spent / 0.25);
		}

		if (type === "redemption") {
			amount = -(Math.floor(Math.random() * 40) + 10);
			createdBy = extraUserId;
			const redeemViaCashier = Math.random() > 0.4;
			relatedId = redeemViaCashier ? cashier.id : null;
		}

		if (type === "transfer") {
			const partner = userIds[Math.floor(Math.random() * userIds.length)];
			const isOutgoing = Math.random() > 0.5;
			amount = isOutgoing ? -25 : 25;
			relatedId = partner;
		}

		extraTransactions.push({
			userId: extraUserId,
			createdBy,
			type,
			spent,
			amount,
			relatedId,
			remark: `Extra ${type} transaction for pagination testing`
		});
	}

	await prisma.transaction.createMany({ data: extraTransactions });

	console.log("🔄 Added 15 corrected transactions for user 4 (user jdoe123).");
	console.log("✅ Seeding complete!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
