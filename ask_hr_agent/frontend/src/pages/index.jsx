import Layout from "./Layout.jsx";

import AskHR from "./AskHR";

import Dashboard from "./Dashboard";

import BackendReference from "./BackendReference";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    AskHR: AskHR,
    
    Dashboard: Dashboard,
    
    BackendReference: BackendReference,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<AskHR />} />
                
                
                <Route path="/AskHR" element={<AskHR />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/BackendReference" element={<BackendReference />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}