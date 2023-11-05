const express = require("express");
const cors = require("cors");
const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://NovelNexusDB:dSCNhINSV4CuS6XL@cluster0.wyy6auz.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const categoryCollection = client.db("NovelNexusDB").collection("Category");
        const booksCollection = client.db("NovelNexusDB").collection("Books");

        // get books category
        app.get("/category", async(req, res)=>{
            const result = await categoryCollection.find().toArray()
            res.send(result)
        })
        // post book 
        app.post('/books', async(req, res)=>{
            const book = req.body
            const result = await booksCollection.insertOne(book)
            res.send(result)
        })

        // get all the book
        app.get("/books", async(req, res)=>{
            const result = await categoryCollection.find().toArray()
            res.send(result)
        })

        // Connect the client to the server	(optional starting in v4.7)
        client.connect();
        // Send a ping to confirm a successful connection
        client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Crud is running...");
});

app.listen(port, () => {
    console.log(`Simple Crud is Running on port ${port}`);
});