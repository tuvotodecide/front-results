import { useState } from 'react';
import BarChart from '../../components/BarChart';
import D3PieChart from '../../components/D3PieChart';
import ResultsTable from '../../components/ResultsTable';
import { Table, BarChart3, PieChart } from 'lucide-react';

interface GraphData {
  name: string;
  value: number;
  color: string;
}

interface GraphProps {
  data: GraphData[];
}

const Graphs: React.FC<GraphProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState('table');
  return (
    <div>
      <div className="mb-4 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`pb-2 px-3 md:px-4 font-medium flex items-center gap-2 ${
              activeTab === 'table'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Table className="w-5 h-5 flex-shrink-0" />
            <span className="max-md:hidden">Tabla</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bars')}
            className={`pb-2 px-3 md:px-4 font-medium flex items-center gap-2 ${
              activeTab === 'bars'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-5 h-5 flex-shrink-0" />
            <span className="hidden md:inline lg:inline">Barras</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pie')}
            className={`pb-2 px-3 md:px-4 font-medium flex items-center gap-2 ${
              activeTab === 'pie'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PieChart className="w-5 h-5 flex-shrink-0" />
            <span className="hidden md:inline lg:inline">Circular</span>
          </button>
        </div>
      </div>
      {activeTab === 'table' && <ResultsTable resultsData={data} />}
      {activeTab === 'bars' && <BarChart data={data} />}
      {activeTab === 'pie' && <D3PieChart data={data} />}
    </div>
  );
};

export default Graphs;
