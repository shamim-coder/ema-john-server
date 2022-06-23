const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 8888;

// middleware
app.use(cors());
app.use(express.json());

// Middle Tier
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_TOKEN_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).send("forbidden");
        } else {
            req.decoded = decoded;
        }
    });
    next();
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ema-john.n18lm9w.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
    try {
        await client.connect();
        const productCollections = client.db("db_ema_john").collection("products");
        const orderCollections = client.db("db_ema_john").collection("orders");

        // AUTH API

        app.post("/login", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_TOKEN_KEY, {
                expiresIn: "1d",
            });
            res.send({ token });
        });

        // Products / Orders API

        app.get("/products", async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const cursor = productCollections.find({});

            let products;

            if (page || size) {
                products = await cursor
                    .skip(page * size)
                    .limit(size)
                    .toArray();
            } else {
                products = await cursor.toArray();
            }

            res.send(products);
        });

        // counts total number of products
        app.get("/nop", async (req, res) => {
            const count = await productCollections.estimatedDocumentCount({});
            res.json({ count });
        });

        // use post to get products by keys (ids)
        app.post("/product_by_keys", async (req, res) => {
            const keys = req.body;
            const ids = keys.map((id) => ObjectId(id));
            const query = { _id: { $in: ids } };
            const cursor = productCollections.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        // Manage Order

        app.post("/orders", async (req, res) => {
            const orderDetails = req.body;
            const result = orderCollections.insertOne(orderDetails);
            res.send(result);
        });

        // get orders
        app.get("/orders", verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email) {
                if (decodedEmail === email) {
                    const query = { email };
                    const cursor = orderCollections.find(query);
                    const orders = await cursor.toArray();
                    res.send(orders);
                } else {
                    res.status(403).send("forbidden");
                }
            } else {
                const cursor = orderCollections.find({});
                const orders = await cursor.toArray();
                res.send(orders);
            }
        });
    } finally {
        // client.close();
    }
};

run().catch(console.dir);

app.get("/", (req, res) => res.send("Hello John! Ema waiting for your response!"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
