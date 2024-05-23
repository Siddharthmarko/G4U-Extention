console.log('background script');

let newDiv = document.createElement('div');
        // Set its innerHTML to the provided HTML
        newDiv.innerHTML = `
            <div style="position: fixed; display: flex; top: 0px; right: 200px; z-index: 999;">
                <div class="prev" style="padding: 25px; margin: 10px; border-radius: 100%; border: 1px solid black; background-color: green;"></div>
                <div class="next" style="padding: 25px; margin: 10px; border-radius: 100%; border: 1px solid black; background-color: red;"></div>
                <div class="save" style="padding: 25px;  margin: 10px; border-radius: 100%; border: 1px solid black; background-color: blue;"></div>
            </div>
        `;
        // Insert the new div before the body tag
        document.body.parentNode.append(newDiv, document.body);

        const prev = document.querySelector('.prev');
        const next = document.querySelector('.next');
        let save = document.querySelector('.save');

        save.addEventListener('click', () => {
                function extractImgTags(htmlContent) {
                    // Regular expression to match <img> tags with aria-hidden="false"
                    var imgRegex = /<img[^>]+aria-hidden="false"[^>]*>/gi;
                
                    // Extract img tags matching the regex
                    var imgTags = htmlContent.match(imgRegex);
                
                    return imgTags || []; // Return an empty array if no matches found
                }
                
                // Example usage:
                // Get the HTML content of the current page
                var htmlContent = document.documentElement.outerHTML;
                
                // Extract img tags with aria-hidden="false"
                var imgTags = extractImgTags(htmlContent);
                
                // Log the extracted img tags
                console.log(imgTags[0]);
                
                var imgTagString = imgTags[0];
                var srcRegex = /src="([^"]+)"/i;
                
                // Match the src attribute value using the regular expression
                var match = imgTagString.match(srcRegex);
                
                // Extract the src attribute value
                var srcValue = match ? match[1] : null;
                
                // console.log(srcValue);
                const requestBody = { url: `${srcValue}` };
                fetch('http://localhost:3000/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json' // Specify content type as JSON
                    },
                    body: JSON.stringify(requestBody)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Response from server:', data);
                    // Process the response data as needed
                    getNextData()
                    .then(nextData => {
                        console.log('Next Data:', nextData);
                        window.location.href = `https://www.google.com/search?q=${nextData.content}&sca_esv=a8b1485e4aab9472&udm=2&biw=1920&bih=953&sxsrf`;
                    })
                    .catch(error => {
                        console.error('Error fetching next data:', error);
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            });
         
        prev.addEventListener('click', () => {
            console.log('PREV');
            getPrevData()
                .then(prevData => {
                    console.log('Previous Data:', prevData);
                    window.location.href = `https://www.google.com/search?q=${prevData.content}&sca_esv=a8b1485e4aab9472&udm=2&biw=1920&bih=953&sxsrf`;
                })
                .catch(error => {
                    console.error('Error fetching previous data:', error);
                });
        });
        
        next.addEventListener('click', () => {
            console.log('next');
            getNextData()
             .then(nextData => {
                console.log('Next Data:', nextData);
                window.location.href = `https://www.google.com/search?q=${nextData.content}&sca_esv=a8b1485e4aab9472&udm=2&biw=1920&bih=953&sxsrf`;
                
            })
                .catch(error => {
                    console.error('Error fetching next data:', error);
                });
        });
        
        // Function to fetch next data from the server
        function getNextData() {
            return fetch('http://localhost:3000/next')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                });
        }
        
        // Function to fetch previous data from the server
        function getPrevData() {
            return fetch('http://localhost:3000/prev')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                });
        }