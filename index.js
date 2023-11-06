const express = require("express");
const cors = require("cors");
const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const borrowedCollection = client.db("NovelNexusDB").collection("Borrowed");

        // get books category
        app.get("/category", async (req, res) => {
            const result = await categoryCollection.find().toArray()
            res.send(result)
        })
        // post book 
        app.post('/books', async (req, res) => {
            const book = req.body
            const result = await booksCollection.insertOne(book)
            res.send(result)
        })

        app.get("/books/:id", async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id),
            };
            const result = await booksCollection.findOne(query);
            // console.log(result);
            res.send(result);
        });
        // data get form the database
        app.get("/books", async (req, res) => {

            let query = {}
            if (req.query?.book_category) {
                query = { category: req.query.book_category }
            }

            const result = await booksCollection.find(query).toArray()
            res.send(result)
        })
        // update quantity 
        app.put('/books/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            console.log("id", id, data);
            const bookId = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedQuantity = {
                $set: {
                    book_quantity: data.book_quantity,
                },
            };
            const result = await booksCollection.updateOne(
                bookId,
                updatedQuantity,
                options
            );
            res.send(result);
        })

        // load card data 
        app.get("/borrowed/:email", async(req, res)=>{
            const {email} = req.params
            const result = await borrowedCollection.find({email}).toArray()
            res.send(result)
        })
        // add data to the borrowed collection
        app.post("/borrowed", async(req, res )=>{
            const {email,
                book_name,
                image,
                author_name,
                category,
                book_rating,
                short_description,
                book_quantity,} = req.body
            const existingBook = await borrowedCollection.findOne({book_name});

            if (existingBook) {
                return res.send({ error: 'Book already exists' });
                }
            const result = await borrowedCollection.insertOne( {email,
                book_name,
                image,
                author_name,
                category,
                book_rating,
                short_description,
                book_quantity,})
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