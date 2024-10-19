import React, { useState } from 'react';
import './App.css';
import Loading from './Loading'; // Import the loading component

function App() {
  const [username, setUsername] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [geminiData, setGeminiData] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(''); // State for notification
  const apiUrl = "http://localhost:3001";

  let pollingIntervalId = null; // Keep pollingIntervalId in the function scope

  const fetchFromS3 = (s3Key) => {
    const s3Url = `http://localhost:3001/fetch-s3/${encodeURIComponent(s3Key)}`;

    fetch(s3Url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('S3 object not available yet');
        }
        return response.json();
      })
      .then((data) => {
        // Data is received; stop polling
        clearInterval(pollingIntervalId);
        setIsPolling(false);
        setGeminiData(data); // Set the fetched data
      })
      .catch((error) => {
        console.error('Error fetching data from S3:', error);
      });
  };

  const pollForS3Object = (s3Key) => {
    setIsPolling(true);
    pollingIntervalId = setInterval(() => {
      fetchFromS3(s3Key);
    }, 5000);

    // Stop polling after 60 seconds
    setTimeout(() => {
      clearInterval(pollingIntervalId); // Clear the interval
      setIsPolling(false);
      setNotification('Polling timed out. Please try again.'); // Show notification
    }, 60000); // 60 seconds timeout
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username) {
      alert('Please enter a Reddit username');
      return;
    }

    // Clear the table and notification immediately
    setGeminiData(null); // Clear previous data
    setError(null);
    setNotification('');

    // Clear existing polling if any
    clearInterval(pollingIntervalId); // Ensure any existing polling is cleared
    setIsPolling(false);

    fetch(`${apiUrl}/fetch/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        return response.json();
      })
      .then((data) => {
        const s3Key = data.data.key;
        pollForS3Object(s3Key);
      })
      .catch((error) => {
        console.error('Error during profile fetch:', error);
        setError('Failed to fetch profile.');
      });
  };

  return (
    <div className="App">
      <header className="terminal">
        <h1>DoxMe</h1>

        <p>
          AI such as Google Gemini and ChatGPT can analyze and extract information from the text provided by users.
          This means that if users share personally identifiable information (PII), such as their names, addresses,
          or other sensitive data, people can obtain this information for other purposes. Always be cautious and avoid
          sharing personal or sensitive details in such interactions.
        </p>

        <p>
          Enter your Reddit username below to discover what AI can tell about you.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Reddit Username:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Reddit username"
            />
          </label>
          <button type="submit">Submit</button>
        </form>

        {error && <p className="error">{error}</p>}
        {notification && <p className="notification">{notification}</p>} {/* Show notification */}

        {isPolling && <Loading />} {/* Use the Loading component */}

        {/* Conditionally render the table only if geminiData is not null */}
        {geminiData && (
          <div>
            <h2>Analysis</h2>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Estimated Place of Birth</td>
                  <td>{geminiData?.demographics?.place_of_birth?.estimate || 'N/A'} (Confidence: {geminiData?.demographics?.place_of_birth?.confidence || 'N/A'})</td>
                </tr>
                <tr>
                  <td>Current Location</td>
                  <td>{geminiData?.demographics?.current_location?.estimate || 'N/A'} (Confidence: {geminiData?.demographics?.current_location?.confidence || 'N/A'})</td>
                </tr>
                <tr>
                  <td>Primary Language</td>
                  <td>{geminiData?.demographics?.primary_language?.estimate || 'N/A'} (Confidence: {geminiData?.demographics?.primary_language?.confidence || 'N/A'})</td>
                </tr>
                <tr>
                  <td>Gender</td>
                  <td>{geminiData?.demographics?.gender?.estimate || 'N/A'} (Confidence: {geminiData?.demographics?.gender?.confidence || 'N/A'})</td>
                </tr>
                <tr>
                  <td>Age</td>
                  <td>{geminiData?.demographics?.age?.estimate || 'N/A'} (Confidence: {geminiData?.demographics?.age?.confidence || 'N/A'})</td>
                </tr>
                <tr>
                  <td>Interests</td>
                  <td>{Array.isArray(geminiData?.interests) ? geminiData?.interests.join(', ') : 'N/A'}</td>
                </tr>
                <tr>
                  <td>Hobbies</td>
                  <td>{Array.isArray(geminiData?.hobbies) ? geminiData?.hobbies.join(', ') : 'N/A'}</td>
                </tr>
                <tr>
                  <td>Education Level</td>
                  <td>{geminiData?.education_level?.estimate || 'N/A'} (Confidence: {geminiData?.education_level?.confidence || 'N/A'})</td>
                </tr>
                <tr>
                  <td>Places Lived</td>
                  <td>
                    {Array.isArray(geminiData?.specific_locations?.places_lived)
                      ? geminiData.specific_locations.places_lived.join(', ')
                      : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td>Places Visited</td>
                  <td>
                    {Array.isArray(geminiData?.specific_locations?.places_visited)
                      ? geminiData.specific_locations.places_visited.join(', ')
                      : 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>

            <h3>Explanation</h3>
            <div>
              {geminiData?.explanation
                ?.replace(/Explanation:\s*\*\*/, '') // Remove "Explanation:**" from the beginning if it exists
                .split('**')
                .map((text, index) => {
                  if (index % 2 === 0) {
                    return <div key={index}>{text}</div>;
                  } else {
                    return <h4 key={index}>{text.trim()}</h4>;
                  }
                })}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;

