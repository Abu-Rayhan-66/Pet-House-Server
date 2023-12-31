const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRETS_KEY)
const app = express();
const port = process.env.PORT || 5002

// middleware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eugvbbj.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const userCollection = client.db('petDB').collection('users')
    const petCollection = client.db('petDB').collection('pets')
    const campaignCollection = client.db('petDB').collection('campaigns')
    const petCategoryCollection = client.db('petDB').collection('petCategory')
    const adoptionCollection = client.db('petDB').collection('adoptions')
    const donationCollection = client.db('petDB').collection('donations')

    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email
      const query = { email: email }
      const user = await userCollection.findOne(query)
      let admin = false;
      if (user) {
        admin = user?.role === 'admin'
      }
      res.send({ admin })
    })

    app.get('/pets/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await petCollection.findOne(query)
      res.send(result)
    })
    app.get('/campaigns/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await campaignCollection.findOne(query)
      res.send(result)
    })

    app.get('/pets', async (req, res) => {
      let query = {}
      const email = req.query.email
      if (email) {
        query = { email: email }
      }
      const result = await petCollection.find(query).sort({ date: -1 }).toArray()
      res.send(result)
    })

    app.get('/campaigns', async (req, res) => {
      let query = {}
      const email = req.query.email
      if (email) {
        query = { email: email }
      }
      const result = await campaignCollection.find(query).sort({ date: -1 }).toArray()
      res.send(result)
    })

    app.get('/donations', async (req, res) => {
      let query = {}
      const email = req.query.email
      if (email) {
        query = { email: email }
      }
      const result = await donationCollection.find(query).sort({ date: -1 }).toArray()
      res.send(result)
    })


    app.get('/adoptions', async (req, res) => {
      const cursor = adoptionCollection.find().sort({ PostDate: -1 })
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/users', async (req, res) => {
      const cursor = userCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/petCategory', async (req, res) => {
      const cursor = petCategoryCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })



    app.post('/users', async (req, res) => {
      const usersData = req.body
      const query = { email: usersData.email }
      const existingUser = await userCollection.findOne(query)
      if (existingUser) {
        return res.send({ message: 'user already exist', insertedId: null })
      }
      console.log(usersData)
      const result = await userCollection.insertOne(usersData)
      res.send(result)
    })

    app.post('/pets', async (req, res) => {
      const newPet = req.body
      console.log(newPet)
      const result = await petCollection.insertOne(newPet)
      res.send(result)
    })

    // donations intent
    app.post('/donations', async (req, res) => {
      const newDonation = req.body
      console.log(newDonation)
      const result = await donationCollection.insertOne(newDonation)
      res.send(result)
    })

    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body
      const amount = parseInt(price * 100)

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types:['card']
      })
      res.send({
        clientSecret: paymentIntent.client_secret,
      })
    })

    app.post('/adoptions', async (req, res) => {
      const newAdoptions = req.body
      console.log(newAdoptions)
      const result = await adoptionCollection.insertOne(newAdoptions)
      res.send(result)
    })

    app.post('/campaigns', async (req, res) => {
      const newCampaign = req.body
      console.log(newCampaign)
      const result = await campaignCollection.insertOne(newCampaign)
      res.send(result)
    })

    app.patch('/pets/:id', async (req, res) => {
      const item = req.body
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          photo: item.photo,
          name: item.name,
          age: item.age,
          category: item.category,
          location: item.location,
          description: item.description,
          longDescription: item.longDescription,
        }
      }
      const result = await petCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    app.patch('/campaigns/:id', async (req, res) => {
      const item = req.body
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          photo: item.photo,
          name: item.name,
          amount: item.amount,
          date: item.date,
          description: item.description,
          longDescription: item.longDescription,
        }
      }
      const result = await campaignCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.patch('/pets/status/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          adopted: true
        },
      };
      const result = await petCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.patch('/adoptions/status/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: 'accepted'
        },
      };
      const result = await adoptionCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.delete('/pets/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await petCollection.deleteOne(query)
      res.send(result)
    })

    app.delete('/adoptions/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await adoptionCollection.deleteOne(query)
      res.send(result)
    })

    app.delete('/campaigns/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await campaignCollection.deleteOne(query)
      res.send(result)
    })

    app.delete('/pets/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await petCollection.deleteOne(query)
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Cat is running')
})

app.listen(port, () => {
  console.log(`Cat server is running on port ${port}`)
})