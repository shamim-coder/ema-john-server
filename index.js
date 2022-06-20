const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ema-john.n18lm9w.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
    try {
        await client.connect();
        const productCollection = client.db("db_ema_john").collection("products");

        app.get("/products", async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const cursor = productCollection.find({});

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
            const count = await productCollection.estimatedDocumentCount({});
            res.json({ count });
        });

        // use post to get products by keys (ids)
        app.post("/product_by_keys", async (req, res) => {
            const keys = req.body;
            const ids = keys.map((id) => ObjectId(id));
            console.log(ids);
            const query = { _id: { $in: ids } };
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });
    } finally {
        // client.close();
    }
};
run().catch(console.dir);

app.get("/", (req, res) => res.send("Hello John! Ema waiting for your response"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
