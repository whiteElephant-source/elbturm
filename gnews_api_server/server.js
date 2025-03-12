const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const fs = require('fs');
const path = require('path'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const apiKey = process.env.GNEWS_API_KEY;
const query = 'Elbtower'; // Change to your desired query
const language = 'de'; // German news
const NEWS_FILE = path.join(__dirname, 'news.json');

app.use(cors());

// Function to fetch and save news
const fetchAndSaveNews = async () => {
    const url = `https://gnews.io/api/v4/search?q=${query}&lang=${language}&token=${apiKey}`;
    
    try {
        console.log(`Fetching news from: ${url}`);
        const response = await fetch(url);
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Fetched news data:", JSON.stringify(data, null, 2));
        
        if (!data.articles || data.articles.length === 0) {
            console.warn("No articles found in API response!");
        }
        
        fs.writeFileSync(NEWS_FILE, JSON.stringify({ articles: data.articles, timestamp: Date.now() }, null, 2));
        console.log("News data saved successfully.");
    } catch (error) {
        console.error("Error fetching news:", error);
    }
};

// Function to get saved news
const getSavedNews = () => {
    if (fs.existsSync(NEWS_FILE)) {
        try {
            console.log("Reading saved news from file...");
            const fileContent = fs.readFileSync(NEWS_FILE, 'utf-8');
            console.log("File content:", fileContent);
            const newsData = JSON.parse(fileContent);
            
            const oneDay = 24 * 60 * 60 * 1000;
            if (Date.now() - newsData.timestamp < oneDay) {
                console.log("Returning saved news.");
                return newsData.articles;
            } else {
                console.log("Saved news is outdated.");
            }
        } catch (error) {
            console.error("Error reading or parsing news.json:", error);
        }
    } else {
        console.log("news.json file does not exist.");
    }
    return null;
};

// Helper function to count common words between two titles
const getCommonWordsCount = (title1, title2) => {
    const words1 = new Set(title1.toLowerCase().split(/\s+/));
    const words2 = new Set(title2.toLowerCase().split(/\s+/));
    let commonCount = 0;
    
    words1.forEach(word => {
        if (words2.has(word)) {
            commonCount++;
        }
    });
    
    return commonCount;
};

// Helper function to filter unique and limited articles (first 5 unique articles)
const getUniqueAndLimitedArticles = (articles, limit = 5) => {
    const uniqueTitles = new Set();
    const uniqueArticles = [];
    
    for (const article of articles) {
        let isDuplicate = false;
        
        // Compare the current article with previously seen articles
        for (const seenArticle of uniqueArticles) {
            const commonWords = getCommonWordsCount(article.title, seenArticle.title);
            if (commonWords > 4) {
                isDuplicate = true;
                break;  // If more than 4 common words, consider it a duplicate
            }
        }
        
        // If not a duplicate, add it to the list of unique articles
        if (!isDuplicate) {
            uniqueArticles.push(article);
            uniqueTitles.add(article.title);
        }
        
        // Stop if we have enough articles
        if (uniqueArticles.length >= limit) break;
    }

    return uniqueArticles;
};

app.get('/news', async (req, res) => {
    const savedNews = getSavedNews();
    if (savedNews) {
        // Filter and limit the news to the first 5 unique articles
        const limitedNews = getUniqueAndLimitedArticles(savedNews);
        return res.json(limitedNews);
    }
    await fetchAndSaveNews();
    const latestNews = getSavedNews() || [];
    const limitedNews = getUniqueAndLimitedArticles(latestNews);
    res.json(limitedNews);
});





// HTML Snippet for displaying the news banner
// Add this to your HTML file
/*
<script>
    async function fetchNews() {
        try {
            const response = await fetch('http://localhost:3000/news');
            const articles = await response.json();
            const newsBanner = document.getElementById('news-banner');
            newsBanner.innerHTML = articles.map(article => `<div class='news-item'><a href="${article.url}" target="_blank">${article.title}</a></div>`).join('');
        } catch (error) {
            console.error("Error fetching news:", error);
        }
    }
    document.addEventListener("DOMContentLoaded", fetchNews);
</script>

<style>
    news-banner {
        display: flex;
        overflow: hidden;
        white-space: nowrap;
        background: #f8f9fa;
        padding: 10px;
        font-size: 16px;
        border-bottom: 2px solid #ccc;
    }
    .news-item {
        margin-right: 20px;
    }
</style>

<div id="news-banner"></div>
*/
