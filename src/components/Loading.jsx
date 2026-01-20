import './Loading.css'

function Loading() {
    return (
        <div className="loading-container">
            <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
            </div>
            <div className="loading-text">
                <h3>Extracting Brand Kit</h3>
                <p>AI is analyzing the website...</p>
            </div>
        </div>
    )
}

export default Loading
