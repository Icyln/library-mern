import express from "express";
import dotenv from "dotenv";
import { connectToDB } from "./config/db.js";
import User from "./models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import cookieParser from "cookie-parser";
import ImageKit from "imagekit";
import Book from "./models/book.model.js";
import path from "path";


dotenv.config();
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const app = express();

const PORT = process.env.PORT || 5000;

console.log("PORT is", process.env.PORT);

const __dirname = path.resolve();

//middlewares
app.use(express.json({limit: "20mb"}));
app.use(cors({
  origin: "http://localhost:5173",  
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  credentials: true                 
}));
app.use(cookieParser());

//Sign Up
app.post("/api/signup", async (req, res) => {
    const {username, email, password} = req.body;

    try {
        if (!username || !email || !password) {
            throw new Error("All fields are required.");
        } 

        const emailExists = await User.findOne({email});

        if(emailExists) {
            return res.status(400).json({message: "User already exists."})
        }

        const usernameExists = await User.findOne({username});
        if(usernameExists) {
            return res.status(400).json({message: "Username is taken. Try another name."})
        }

        //Hash the password
        const hasedPassword = await bcryptjs.hash(password, 10);

        const userDoc = await User.create({
            username,
            email,
            password: hasedPassword,
        });

        //JWT
        if (userDoc) {
            const token = jwt.sign({ id: userDoc._id }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
        }

        return res
        .status(200)
        .json({user: userDoc, message: "User created successfully."});
    } catch (error) {
        res.status(400).json({message: error.message});
    }
});

//Login
app.post("/api/log-in", async(req, res) => {
    const {email, password} = req.body;

    try{
        const userDoc = await User.findOne({email});

        if (!userDoc) {
            return res.status(400).json({message: "Invalid Credentials"});
        }

        const isPasswordValid = bcryptjs.compareSync(
            password,
            userDoc.password
        );

        if(!isPasswordValid) {
            return res.status(400).json({message: "Invalid Credentials"});
        }

        //JWT
        if (userDoc) {
            const token = jwt.sign({ id: userDoc._id }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
        }

        return res
        .status(200)
        .json({user: userDoc, message: "Logged in successfully."});

    } catch (error) {
        res.status(400).json({message: error.message});
    }
});

//Fetch user
app.get("/api/fetch-user", async (req, res) => {
    const {token} = req.cookies;

    if(!token) {
        return res.status(401).json({message: "No token provided."});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded) {
            return res.status(401).json({message: "Invalid token"});
        }

        const userDoc = await User.findById(decoded.id).select("password");

        if(!userDoc) {
            return res.status(400).json({message: "User not found"});
        }

        res.status(200).json({user: userDoc});
    } catch (error) {
        res.status(400).json({message: error.message});
    }
});

//Log Out
app.post("/api/logout", async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({message: "Logged out successfully"});
});

// ========== Book Function ==========
app.post("/api/add-book", async (req, res) => {
    const {image, title, subtitle, author, link, review} = req.body;
    const {token} = req.cookies;
    if(!token) {
        return res.status(401).json({message: "No token provided"});
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded){
            return res.status(401).json({message: "Invalid Token"});
        }

        // Upload image to ImageKit
    const imageResponse = await imagekit.upload({
      file: image, 
      fileName: `${title}-cover.jpg`,
      folder: "/library",
    });

    const userDoc = await User.findById(decoded.id).select("-password");

    const book = await Book.create({
        image: imageResponse.url,
        title,
        subtitle,
        author, 
        link,
        review,
        user: userDoc._id,
    });

    return res.status(200).json({book, message: "Book added successfully"})
    } catch (error) {
        res.status(400).json({message: error.message});
    }
})

//Fetch book data from database
app.get("/api/fetch-books", async (req, res) => {
    try {
        const books = await Book.find().sort({createdAt: -1});

        return res.status(200).json({books});
    } catch (error) {
        res.status(400).json({message: error.message});
    }
});

//Search
app.get("/api/search", async (req, res) => {
    try {
        const searchTerm = req.query.searchTerm || "";

        const books = await Book.find({
            title: {$regex: searchTerm, $options: "i"},
        }).sort({createdAt: -1});

        return res.status(200).json({books});
    } catch (error) {
        res.status(400).json({message: error.message});
    }
});

//Book Details
app.get("/api/fetch-book/:id", async (req, res) => {
    try {
        const {id} = req.params;

        const book = await Book.findById(id).populate("user", ["username"]);

        return res.status(200).json({book})

    } catch (error) {
        res.status(400).json({message: error.message});
    }
})

//Delete
app.delete("/api/delete-book/:id", async (req, res) => {
    const {id} = req.params;
    const {token} = req.cookies;
    if(!token) {
        return res.status(401).json({message: "No token provided."});
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded) {
            return res.status(401).json({message: "Invalid token."});
        }

        const book = await Book.findById(id);

        //Delete the image first
        const parts = book.image.split("/");
        const fileName = parts[parts.length -1];

        const imageId = fileName.split(".")[0];

        imagekit.deleteFile(`library/${imageId}`)
        .then((result) => console.log("result", result));

        //Delete the data from database
        await Book.findByIdAndDelete(id);

        return res.status(200).json({message: "Book deleted successfully."});
    } catch (error) {
        return res.status(400).json({message: error.message});

    }
})

//Update Function
app.post("/api/update-book/:id", async (req, res) => {
    const {image, title, subtitle, author, link, review} = req.body;

    const {token} = req.cookies;
    if (!token) {
        return res.status(401).json({message: "No token provided."});
    }

    const{id} = req.params;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded) {
            return res.status(401).json({message: "Invalid token."})
        }

        const book = await Book.findById(id);

        if(image) {
        //Delete the previous image first
        const parts = book.image.split("/");
        const fileName = parts[parts.length -1];

        const imageId = fileName.split(".")[0];

        imagekit.deleteFile(`library/${imageId}`)
        .then((result) => console.log("result", result));

        //Upload neew image
        const imageResponse = await imagekit.upload(image, {
            folder: "/library"
        });

        //Update data in database
        const updatedBook = await Book.findByIdAndUpdate(id, {
            image: imageResponse.url,
            title, 
            subtitle, 
            author, 
            link, 
            review,
        });
        return res
        .status(200)
        .json({book: updatedBook, message: "Book updated successfully"});
    }

    const updatedBook = await Book.findByIdAndUpdate(id, {
        title,
        subtitle,
        author,
        link,
        review,
    });
    return res
    .status(200)
    .json({book: updatedBook, message: "Book updated successfully"})
    } catch (error) {
        res.status(400).json({message: error.message});
    }
});

if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname, "frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

app.listen(PORT, async () => {
    await connectToDB();
    console.log("Server started at PORT: ", PORT)
})