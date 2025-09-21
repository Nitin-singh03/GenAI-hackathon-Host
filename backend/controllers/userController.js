const express = require("express");
const userModel = require("../models/userModel.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../app");

require("dotenv").config();


exports.registerUser = async (req, res) => {
    try {
        const {name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create new user
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
        });

        // generate token
        const token = jwt.sign(
            { id: newUser._id, email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        newUser.token = token;

        // save to DB
        await newUser.save();

        // send response AFTER saving
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                email: newUser.email,
                token: newUser.token,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};


exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // generate token
        const token = jwt.sign(
            { id: user._id, email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );



        // cookie section

        const options={
            expires:new Date(Date.now()+3*24*60*60*1000),
            httpOnly:true,
        };

        res.status(200).cookie("token",token,options).json({    
            message: "Login successful",
            success:true,
            token,
            user: {
                id: user._id,
                email: user.email,
            },
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

