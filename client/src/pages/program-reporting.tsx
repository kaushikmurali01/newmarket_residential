import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, Users, Home, MapPin, Zap, Wrench, Wind, TrendingUp, TrendingDown, 
  AlertTriangle, Calendar, FileText, BarChart3, PieChart, Activity, Thermometer,
  Shield, Building, Settings, Eye
} from "lucide-react";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  PointElement, 
  LineElement,
  Filler,
  RadialLinearScale
} from 'chart.js';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import type { Audit } from "@shared/schema";
import enervaLogo from "@assets/Enerva-Vector-Logo-1 (4).svg";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale
);

const chartColors = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  teal: '#14B8A6',
  orange: '#F97316',
  pink: '#EC4899',
  indigo: '#6366F1',
  gray: '#6B7280'
};

const sophisticatedChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
          family: 'Inter, system-ui, sans-serif'
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#374151',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11
        }
      }
    }
  }
};

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        generateLabels: (chart: any) => {
          const data = chart.data;
          if (data.labels.length && data.datasets.length) {
            return data.labels.map((label: string, i: number) => {
              const value = data.datasets[0].data[i];
              const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              return {
                text: `${label} (${percentage}%)`,
                fillStyle: data.datasets[0].backgroundColor[i],
                strokeStyle: data.datasets[0].backgroundColor[i],
                pointStyle: 'circle'
              };
            });
          }
          return [];
        }
      }
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : '0.0';
          return `${context.label}: ${context.raw} (${percentage}%)`;
        }
      }
    }
  }
};

export default function ProgramReporting() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch all audits
  const { data: audits, isLoading: auditsLoading } = useQuery<Audit[]>({
    queryKey: ["/api/audits"],
    retry: false,
  });

  // Comprehensive analytics data processing
  const analyticsData = useMemo(() => {
    if (!audits || audits.length === 0) return null;

    const completedAudits = audits.filter(audit => audit.status === "completed");
    const inProgressAudits = audits.filter(audit => audit.status === "in_progress");
    const draftAudits = audits.filter(audit => audit.status === "draft");

    // Time-based analysis
    const auditsByMonth = audits.reduce((acc, audit) => {
      if (audit.createdAt) {
        const month = new Date(audit.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Geographic analysis
    const provinceData = completedAudits.reduce((acc, audit) => {
      const province = audit.customerProvince || 'Unknown';
      acc[province] = (acc[province] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const cityData = completedAudits.reduce((acc, audit) => {
      const city = audit.customerCity || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Building characteristics analysis
    const homeTypeAnalysis = completedAudits.reduce((acc, audit) => {
      const type = audit.homeType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Not Specified';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const auditTypeAnalysis = completedAudits.reduce((acc, audit) => {
      const type = audit.auditType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Not Specified';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Advanced building envelope analysis
    const foundationTypes = completedAudits.reduce((acc, audit) => {
      try {
        const foundation = audit.foundationInfo as any;
        if (foundation?.foundationType) {
          const types = Array.isArray(foundation.foundationType) ? foundation.foundationType : [foundation.foundationType];
          types.forEach((type: string) => {
            const cleanType = type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
            acc[cleanType] = (acc[cleanType] || 0) + 1;
          });
        }
      } catch (e) {}
      return acc;
    }, {} as Record<string, number>);

    // HVAC Systems analysis
    const heatingSystemAnalysis = completedAudits.reduce((acc, audit) => {
      try {
        const heating = audit.heatingInfo as any;
        if (heating?.heatingSystemType && Array.isArray(heating.heatingSystemType)) {
          heating.heatingSystemType.forEach((type: string) => {
            const cleanType = type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
            acc[cleanType] = (acc[cleanType] || 0) + 1;
          });
        }
      } catch (e) {}
      return acc;
    }, {} as Record<string, number>);

    const heatingSourceAnalysis = completedAudits.reduce((acc, audit) => {
      try {
        const heating = audit.heatingInfo as any;
        if (heating?.source) {
          const source = heating.source.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          acc[source] = (acc[source] || 0) + 1;
        }
      } catch (e) {}
      return acc;
    }, {} as Record<string, number>);

    // Ventilation analysis
    const ventilationAnalysis = completedAudits.reduce((acc, audit) => {
      try {
        const ventilation = audit.ventilationInfo as any;
        if (ventilation?.ventilationType) {
          const type = ventilation.ventilationType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          acc[type] = (acc[type] || 0) + 1;
        }
      } catch (e) {}
      return acc;
    }, {} as Record<string, number>);

    // Atypical loads analysis
    const atypicalLoadsAnalysis = completedAudits.reduce((acc, audit) => {
      try {
        const loads = audit.atypicalLoads as any;
        if (loads && typeof loads === 'object') {
          Object.entries(loads).forEach(([key, value]) => {
            if (value === true) {
              const loadType = key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
              acc[loadType] = (acc[loadType] || 0) + 1;
            }
          });
        }
      } catch (e) {}
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAudits: audits.length,
      completedAudits: completedAudits.length,
      inProgressAudits: inProgressAudits.length,
      draftAudits: draftAudits.length,
      completionRate: audits.length > 0 ? (completedAudits.length / audits.length) * 100 : 0,
      auditsByMonth,
      provinceData,
      cityData,
      homeTypeAnalysis,
      auditTypeAnalysis,
      foundationTypes,
      heatingSystemAnalysis,
      heatingSourceAnalysis,
      ventilationAnalysis,
      atypicalLoadsAnalysis,
      uniqueProvinces: Object.keys(provinceData).length,
      uniqueCities: Object.keys(cityData).length,
      avgAuditsPerMonth: Object.values(auditsByMonth).length > 0 ? 
        Object.values(auditsByMonth).reduce((a, b) => a + b, 0) / Object.values(auditsByMonth).length : 0
    };
  }, [audits]);

  // Chart data generators
  const createChartData = (data: Record<string, number>, type: 'bar' | 'pie' = 'bar') => {
    const entries = Object.entries(data).filter(([_, value]) => value > 0);
    
    if (entries.length === 0) {
      return {
        labels: ['No Data Available'],
        datasets: [{
          label: type === 'bar' ? 'Count' : undefined,
          data: [0],
          backgroundColor: [chartColors.gray],
          borderColor: type === 'bar' ? [chartColors.gray] : undefined,
          borderWidth: type === 'bar' ? 1 : undefined,
        }],
        isEmpty: true
      };
    }

    const colors = [
      chartColors.primary,
      chartColors.secondary,
      chartColors.accent,
      chartColors.purple,
      chartColors.teal,
      chartColors.orange,
      chartColors.pink,
      chartColors.indigo,
      chartColors.danger
    ];

    return {
      labels: entries.map(([key]) => key),
      datasets: [{
        label: type === 'bar' ? 'Count' : undefined,
        data: entries.map(([_, value]) => value),
        backgroundColor: entries.map((_, index) => colors[index % colors.length]),
        borderColor: type === 'bar' ? entries.map((_, index) => colors[index % colors.length]) : undefined,
        borderWidth: type === 'bar' ? 1 : undefined,
      }],
      isEmpty: false
    };
  };

  const createTimeSeriesData = () => {
    if (!analyticsData) return { labels: [], datasets: [], isEmpty: true };
    
    const entries = Object.entries(analyticsData.auditsByMonth).sort(([a], [b]) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    if (entries.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Audits Created',
          data: [0],
          borderColor: chartColors.primary,
          backgroundColor: chartColors.primary + '20',
          tension: 0.4,
          fill: true,
        }],
        isEmpty: true
      };
    }

    return {
      labels: entries.map(([month]) => month),
      datasets: [{
        label: 'Audits Created',
        data: entries.map(([_, count]) => count),
        borderColor: chartColors.primary,
        backgroundColor: chartColors.primary + '20',
        tension: 0.4,
        fill: true,
      }],
      isEmpty: false
    };
  };

  const EmptyChart = ({ message = "No data available for this analysis" }: { message?: string }) => (
    <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <div className="text-center">
        <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );

  if (authLoading || auditsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Data Available</h2>
          <p className="text-gray-600">Complete some audits to view program analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="w-16 h-12 flex items-center justify-center">
              <img src={enervaLogo} alt="Enerva" className="h-10 w-auto" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Program Analytics
              </h1>
              <p className="text-sm text-gray-600">Advanced Energy Audit Insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="px-3 py-1">
              <Activity className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Executive Summary Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Audits</p>
                  <p className="text-3xl font-bold">{analyticsData.totalAudits}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">Active Program</span>
                  </div>
                </div>
                <Users className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold">{analyticsData.completedAudits}</p>
                  <div className="flex items-center mt-2">
                    <Progress value={analyticsData.completionRate} className="w-16 h-2 mr-2" />
                    <span className="text-sm">{analyticsData.completionRate.toFixed(1)}%</span>
                  </div>
                </div>
                <FileText className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Provinces</p>
                  <p className="text-3xl font-bold">{analyticsData.uniqueProvinces}</p>
                  <div className="flex items-center mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">Coverage</span>
                  </div>
                </div>
                <Home className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Monthly Avg</p>
                  <p className="text-3xl font-bold">{analyticsData.avgAuditsPerMonth.toFixed(1)}</p>
                  <div className="flex items-center mt-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="text-sm">Velocity</span>
                  </div>
                </div>
                <BarChart3 className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-white shadow-md">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="geographic" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Geographic</span>
            </TabsTrigger>
            <TabsTrigger value="building" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Building Types</span>
            </TabsTrigger>
            <TabsTrigger value="systems" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>HVAC Systems</span>
            </TabsTrigger>
            <TabsTrigger value="efficiency" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Efficiency</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <span>Audit Progress Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {createTimeSeriesData().isEmpty ? (
                      <EmptyChart message="No timeline data available" />
                    ) : (
                      <Line data={createTimeSeriesData()} options={sophisticatedChartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5 text-green-500" />
                    <span>Audit Type Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {createChartData(analyticsData.auditTypeAnalysis, 'pie').isEmpty ? (
                      <EmptyChart message="No audit type data available" />
                    ) : (
                      <Pie data={createChartData(analyticsData.auditTypeAnalysis, 'pie')} options={pieChartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Geographic Tab */}
          <TabsContent value="geographic" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    <span>Provincial Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {createChartData(analyticsData.provinceData).isEmpty ? (
                      <EmptyChart message="No provincial data available" />
                    ) : (
                      <Bar data={createChartData(analyticsData.provinceData)} options={sophisticatedChartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Home className="h-5 w-5 text-purple-500" />
                    <span>Top Cities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {Object.keys(analyticsData.cityData).length === 0 ? (
                      <EmptyChart message="No city data available" />
                    ) : (
                      <Bar 
                        data={createChartData(
                          Object.fromEntries(
                            Object.entries(analyticsData.cityData)
                              .sort(([,a], [,b]) => b - a)
                              .slice(0, 10)
                          )
                        )} 
                        options={sophisticatedChartOptions} 
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Building Types Tab */}
          <TabsContent value="building" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-green-500" />
                    <span>Home Type Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {createChartData(analyticsData.homeTypeAnalysis, 'pie').isEmpty ? (
                      <EmptyChart message="No home type data available" />
                    ) : (
                      <Doughnut data={createChartData(analyticsData.homeTypeAnalysis, 'pie')} options={pieChartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-orange-500" />
                    <span>Foundation Types</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {createChartData(analyticsData.foundationTypes).isEmpty ? (
                      <EmptyChart message="No foundation data available" />
                    ) : (
                      <Bar data={createChartData(analyticsData.foundationTypes)} options={sophisticatedChartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* HVAC Systems Tab */}
          <TabsContent value="systems" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Thermometer className="h-5 w-5 text-red-500" />
                    <span>Heating Systems</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {createChartData(analyticsData.heatingSystemAnalysis, 'pie').isEmpty ? (
                      <EmptyChart message="No heating system data available" />
                    ) : (
                      <Pie data={createChartData(analyticsData.heatingSystemAnalysis, 'pie')} options={pieChartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span>Energy Sources</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {createChartData(analyticsData.heatingSourceAnalysis).isEmpty ? (
                      <EmptyChart message="No energy source data available" />
                    ) : (
                      <Bar data={createChartData(analyticsData.heatingSourceAnalysis)} options={sophisticatedChartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wind className="h-5 w-5 text-teal-500" />
                    <span>Ventilation Systems</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {createChartData(analyticsData.ventilationAnalysis, 'pie').isEmpty ? (
                      <EmptyChart message="No ventilation data available" />
                    ) : (
                      <Doughnut data={createChartData(analyticsData.ventilationAnalysis, 'pie')} options={pieChartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wrench className="h-5 w-5 text-indigo-500" />
                    <span>Atypical Loads</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {createChartData(analyticsData.atypicalLoadsAnalysis).isEmpty ? (
                      <EmptyChart message="No atypical loads data available" />
                    ) : (
                      <Bar data={createChartData(analyticsData.atypicalLoadsAnalysis)} options={sophisticatedChartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Efficiency Tab */}
          <TabsContent value="efficiency" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    <span>Program Performance Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {analyticsData.completionRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                    <Progress value={analyticsData.completionRate} className="mt-3" />
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {analyticsData.uniqueProvinces}
                    </div>
                    <div className="text-sm text-gray-600">Provinces Covered</div>
                    <div className="mt-3 text-xs text-green-700">National Reach</div>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {analyticsData.uniqueCities}
                    </div>
                    <div className="text-sm text-gray-600">Cities Served</div>
                    <div className="mt-3 text-xs text-purple-700">Market Penetration</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}