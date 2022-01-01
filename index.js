const express = require("express");
const { MongoClient, CURSOR_FLAGS } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const stripe = require("stripe")(
    "sk_test_51KD5r7F2NFuyTuJd1UXTqXBsSxWjqTRYMs1nC60j0WNWqN1GmnEhaDv7StzXBUfMbGGvcWgmrf7ebPJYOpKq6MT700nVWLl84s"
);

require("dotenv").config();
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gzsrh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


async function run() {
    try {
        await client.connect();
        console.log("connect to database");
        const database = client.db("HeroRider");
        const usersCollection = database.collection("usersCollection");
        const ordersCollection = database.collection("ordersCollection");
        const packages = database.collection("packages");

        //post api for users
        app.post("/users", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        //post api for orders
        app.post("/orders", async (req, res) => {
            const order = req.body;
            console.log("hit the post", order);
            const result = await ordersCollection.insertOne(order);
            console.log(result);
            res.json(result);
        });

        //get api for packages
        app.get("/packages", async (req, res) => {
            const cursor = packages.find({});
            const package = await cursor.toArray();
            res.send(package);
        });

        //get api for users
        app.get("/users", async (req, res) => {
            const users = await usersCollection.find({}).toArray();
            const cursor = usersCollection.find({});
            const count = await cursor.count();
            console.log(count);
            // filter admin from users
            const adminFilter = users.filter(
                (user) => user.email !== "admin@admin.com"
            );
            console.log(req.query);
            // filter by email, phone or fullname
            const { email, phone, fullName } = req.query;
            let userFilter = [...adminFilter];
            if (email) {
                userFilter = userFilter.filter((user) =>
                    user.email.includes(email)
                );
                console.log(userFilter);
            }
            if (phone) {
                userFilter = userFilter.filter((user) =>
                    user.phone.includes(phone)
                );
            }
            if (fullName) {
                userFilter = userFilter.filter((user) =>
                    user.fullName.includes(fullName)
                );
            }
            res.send({ count, userFilter });
        });
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === "admin") {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        // Stripe
        app.post("/create-payment-intent", async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency: "usd",
                payment_method_types: ["card"],
            });
            res.json({
                clientSecret: paymentIntent.client_secret,
            });
        });
    }
    finally {
        // await client.close()
    }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
    res.send("Running assignment 12 Server");
});

app.listen(port, () => {
    console.log("running database", port);
});
