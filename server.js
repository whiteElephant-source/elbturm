const express = require('express');
const axios = require('axios');
require('dotenv').config();  // Ensure you load your .env file

const app = express();
const PORT = 3000;

const API_KEY = process.env.CURRENTS_API_KEY; // Add your Currents API key here

app.get('/news', async (req, res) => {
    // Set default to 'Elbtower', but allow the user to pass a query
    const query = req.query.query || 'Elbtower';  
    const url = `https://api.currentsapi.services/v1/search?apiKey=${API_KEY}&q=${query}&language=de`;  // Using 'de' for German articles
    
    // Log the request URL for debugging
    console.log("Request URL:", url);

    try {
        const response = await axios.get(url);  // Make the request to the Currents API
        const articles = response.data.news;  // Extract articles from the response

        // Filter articles to only include those that contain 'Elbtower' in the title or content
        const filteredArticles = articles.filter(article => 
            article.title.toLowerCase().includes('elbtower') || 
            article.description.toLowerCase().includes('elbtower')
        );

        // If we have filtered articles, return them; otherwise, inform that no news was found
        if (filteredArticles.length > 0) {
            res.json(filteredArticles);  // Return the filtered articles to the client
        } else {
            res.json({ message: 'No news found for "Elbtower".' });
        }
    } catch (error) {
        console.error('Error fetching news:', error.response ? error.response.data : error.message);  // Log error details
        res.status(500).json({ error: 'Error fetching news from Currents API.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
