import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DoctorProfileCard from '../components/DoctorProfileCard';
import { searchDoctorsAPI } from '../api/doctorApi';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchResultsPage = () => {
  const queryParams = useQuery();
  const query = queryParams.get('query') || '';
  const city = queryParams.get('city') || '';
  const clinic = queryParams.get('clinic') || '';
  const specialty = queryParams.get('specialty') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only search if at least one filter is filled
    if (!query && !city && !clinic && !specialty) return;
    setLoading(true);
    setError('');
    // Always send raw specialty input for partial matching
    searchDoctorsAPI(city, query, clinic, specialty.trim())
      .then(data => {
        setResults(data || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch search results.');
        setLoading(false);
      });
  }, [query, city, clinic, specialty]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-100 to-white py-8 px-4">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-3xl font-extrabold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 animate-heading-glow drop-shadow-lg">Search Results</h1>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-blue-600 text-lg font-semibold">Loading...</div>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-2">😕</div>
            <div className="text-center text-red-500 text-lg font-semibold">{error}</div>
          </div>
        )}
        {!loading && !error && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-2">🔍</div>
            <div className="text-center text-gray-500 text-lg font-semibold">No doctors found for your search.</div>
            <div className="text-center text-gray-400 text-sm mt-2">Try changing your search term or filters.</div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-8">
          {results.map((doctor) => (
            <div key={doctor._id} className="transition-transform hover:scale-105 hover:shadow-2xl rounded-2xl bg-white/90 border border-blue-100 shadow-xl p-4">
              <DoctorProfileCard doctor={doctor} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
