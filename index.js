const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

app.use(cors({
    origin:["http://localhost:5173","https://novel-nexus-io.web.app" ], 
    credentials: true    
}));
app.use(express.json());
app.use(cookieParser())

//   https://novel-nexus-io.web.app
 //   https://assignment-11-novel-nexus-server.vercel.app
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wyy6auz.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const logger = async (req, res, next)=>{
    console.log("logger", req.method, req,URL);
    next()
}
const verifyToken = async (req, res, next)=>{
    const token = req?.cookies?.token;

    console.log(token);
    if(!token){
        return res.status(404).send({message: "Unauthorize Access 1"})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRETE, (err, decoded)=>{
        if(err){
            return res.status(404).send({message: "Unauthorize Access 2"})
        }
        req.user = decoded

        next()
    })
}

async function run() {
    try {
        const categoryCollection = client.db("NovelNexusDB").collection("Category");
        const booksCollection = client.db("NovelNexusDB").collection("Books");
        const borrowedCollection = client.db("NovelNexusDB").collection("Borrowed");
        const reviewsCollection = client.db("NovelNexusDB").collection("Reviews");
        const slidersCollection = client.db("NovelNexusDB").collection("Sliders");
        const adminCollection = client.db("NovelNexusDB").collection("Admin");
        const requestCollection = client.db("NovelNexusDB").collection("bookRequests");
        // token.........
        app.post('/jwt', async(req, res) =>{
            const user = req.body;
            const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRETE, {expiresIn: "1h"})
            res
            .cookie("token", token,{
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            }).send("Token Generated")
        })

        app.post("/logout", async (req, res)=>{
            const user = req.body
            res.clearCookie("token", {maxAge: 0}).send("Token Cleared")
        })



        
        app.get('/slider', async(req, res) =>{
            const result = await slidersCollection.find().toArray()
            res.send(result)
        })


        app.post('/book-request', async(req, res)=>{
            const request = req.body
            const {book_name} = request;
            const existingBook = await requestCollection.findOne({book_name});

            if (existingBook) {
                return res.send({ error: 'Already in Request list' });
                }
            const result = await requestCollection.insertOne(request)
            res.send(result)
        })

        // get books category
        app.get("/category", async (req, res) => {
            const result = await categoryCollection.find().toArray()
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
        // data get form the database for.......allBook.jsx
        app.get("/allBooks",logger, verifyToken, async (req, res) => {
            const userEmail = req.query.email;

            if(req.user.email !== userEmail){
                return res.status(401).send({message: "Forbidden"})
            }
           
            const result = await booksCollection.find().toArray()
            res.send(result)
        })

         // filter by quantity.............allBook.jsx 
         app.get("/bookfilter", async(req, res) =>{
            const query = {book_quantity : {$gt : 0}}
            const result = await booksCollection.find(query).toArray()
            res.send(result)
        })

        // post book for addBook component......addBook.jsx
        app.post('/postBooks', async (req, res) => {
            const userEmail = req.query.email
            if(req.user.email !== userEmail){
                return res.status(401).send({message: "Forbidden"})
            }
            const book = req.body
            console.log(book);
            const result = await booksCollection.insertOne(book)
            res.send(result)
        })

        // book update for update form
        app.put("/update-books/:id", async(req, res)=>{
            const id = req.params.id;
            const data = req.body;
            const bookId = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedBooks = {
                $set: {
                    book_quantity: data.book_quantity,
                    book_name: data.book_name,
                    image: data.image,
                    book_quantity: data.book_quantity,
                    author_name: data.author_name,
                    category: data.category,
                    book_rating: data.book_rating,
                    short_description: data.short_description,
                    book_summary: data.book_summary,
                },
            };
            const result = await booksCollection.updateOne(
                bookId,
                updatedBooks,
                options
            );
            res.send(result);
        })

        // data load by category ..........CategorizedBooks.jsx
        app.get("/categorizedBooks", async(req, res)=>{
           const category = req.query.book_category

           let query = {}
           if (category) {
               query = { category: category }
           }
           const result = await booksCollection.find(query).toArray()
            res.send(result)
        }) 

          // update quantity 
          app.put('/books/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
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

       


        app.get("/reviews", async(req, res) =>{
            const result = await reviewsCollection.find().toArray()
            res.send(result)
        })

        app.post("/reviews", async(req, res)=>{
            const data = req.body
            const result = await reviewsCollection.insertOne(data)
            res.send(result)
        })
      

       
        // add data to the borrowed collection
        app.post("/borrowed", async(req, res )=>{
            const {
                email,
                objectId,
                return_date,
                borrowed_date,
                book_name,
                image,
                author_name,
                category,
                book_rating,
                short_description,
                book_quantity
            } = req.body
            console.log(email, objectId);

            const idQuery = {objectId : {$eq : objectId}}
            const emailQuery = {email : {$eq: email}}
            
            const idExist = await borrowedCollection.findOne(idQuery);
            const emailExist = await borrowedCollection.findOne(emailQuery);
            
            if (idExist && emailExist) {
                return res.send({ error: 'Book  exists', email: email, obj:objectId });
            }
            const result = await borrowedCollection.insertOne( {email,
                objectId,
                return_date,
                borrowed_date,
                book_name,
                image,
                author_name,
                category,
                book_rating,
                short_description,
                book_quantity,})
            res.send(result)
        })

         // load card data 
         app.get("/borrowed/:email", logger, verifyToken, async(req, res)=>{
            const {email} = req.params
            console.log("/borrowed",email);
                console.log(req.user.email);
            if(req.user.email !== req.params.email){
                return res.status(401).send({message: "Forbidden"})
            }

            const query = {email : {$eq : email}}
            const result = await borrowedCollection.find(query).toArray()
            res.send(result)
        })

        // Delete borrowed Book 
        app.delete("/borrowed/:id", async(req, res)=>{
            const id = req.params.id
            const userId = {_id: new ObjectId(id)}
            const result = await borrowedCollection.deleteOne(userId)
            res.send(result)
        })

        // admin
        app.get('/admin', async(req, res)=>{
            const email = req.query.email
           if(email != 'librarian@gmail.com'){
            return res.send('')
           }
            const result = await adminCollection.find().toArray()

            res.send(["Authorized"])
            
        })

       
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Crud is running...");
});

app.listen(port, () => {
    console.log(`Simple Crud is Running on port ${port}`);
});