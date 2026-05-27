import './BrandStudioPage.css'

const WINDOWS_DOWNLOAD_URL = 'https://github.com/RaeShe666/brand-studio/releases/download/v0.2.2/Brand.Studio-Windows-0.2.2-Setup.exe'

function BrandStudioPage() {
    return (
        <main className="landing-page brand-studio-landing">
            <div className="landing-text brand-studio-text">
                <p className="landing-line">Brand Studio now lives on your desktop.</p>
                <p className="landing-line">Download the Windows version below.</p>
                <div className="brand-studio-download-row">
                    <a className="brand-studio-download" href={WINDOWS_DOWNLOAD_URL}>
                        Download for Windows x64
                    </a>
                </div>
            </div>
        </main>
    )
}

export default BrandStudioPage
