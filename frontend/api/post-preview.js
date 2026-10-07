/* global process */
export default async function handler(req, res) {
  const { id } = req.query;
  const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://straycare.onrender.com/api';
  
  try {
    // Determine if the request is from a bot
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    const isBot = [
      'bot', 'facebookexternalhit', 'twitterbot', 'whatsapp', 'linkedinbot',
      'pinterest', 'slackbot', 'telegrambot', 'discordbot'
    ].some(bot => userAgent.includes(bot));

    if (isBot) {
      // Fetch post data from backend
      const response = await fetch(`${API_BASE_URL}/posts/${id}`);
      if (!response.ok) {
        return res.status(404).send('Post not found');
      }
      
      const { data: post } = await response.json();
      
      const title = post.caption ? `${post.caption.substring(0, 50)}... - StrayCare` : 'StrayCare Post';
      const description = post.caption || 'Check out this post on StrayCare.';
      const image = post.postImage || 'https://Furzo.vercel.app/FurzoBanner.jpg';
      const url = `https://${req.headers.host}/post/${id}`;
      
      // Return a basic HTML page with meta tags for bots
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <meta name="description" content="${description}" />
          
          <!-- Open Graph / Facebook / WhatsApp -->
          <meta property="og:type" content="article" />
          <meta property="og:url" content="${url}" />
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:image" content="${image}" />
          
          <!-- Twitter -->
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content="${url}" />
          <meta name="twitter:title" content="${title}" />
          <meta name="twitter:description" content="${description}" />
          <meta name="twitter:image" content="${image}" />
        </head>
        <body>
          <h1>${title}</h1>
          <p>${description}</p>
          <img src="${image}" alt="Post Image" />
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      return res.status(200).send(html);
    }
    
    // If not a bot, we want to serve the normal React app.
    // However, since we are intercepting the route in Vercel, we need to return the index.html
    // Let's fetch the index.html from our own host and return it.
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const indexResponse = await fetch(`${protocol}://${host}/index.html`);
    const indexHtml = await indexResponse.text();
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(indexHtml);
    
  } catch (error) {
    console.error('Error generating post preview:', error);
    res.status(500).send('Internal Server Error');
  }
}
