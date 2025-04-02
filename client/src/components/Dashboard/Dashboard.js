const Dashboard = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-light-600 mb-6">Health Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Adherence</h2>
        <p className="text-gray-600">Chart placeholder</p>
      </div>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Food Intake</h2>
        <p className="text-gray-600">Chart placeholder</p>
      </div>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Exercise</h2>
        <p className="text-gray-600">Chart placeholder</p>
      </div>
    </div>
  </div>
);
  
export default Dashboard;