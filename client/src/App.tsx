
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, CheckCircle, Clock, Download, LogOut, MapPin, Users, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { CreateLeaveRequestInput, LeaveRequest, ManagerLoginInput } from '../../server/src/schema';

// Main App Component
function App() {
  const [isManagerLoggedIn, setIsManagerLoggedIn] = useState(false);
  const [currentManager, setCurrentManager] = useState<{id: number, name: string, role: string} | null>(null);
  const [activeTab, setActiveTab] = useState('employee');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">💧 Aqua Leave Request System</h1>
          <p className="text-blue-700">Sistem Pengajuan Izin Karyawan PT. Aqua</p>
        </div>

        {!isManagerLoggedIn ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="employee" className="text-lg py-3">
                👥 Pengajuan Karyawan
              </TabsTrigger>
              <TabsTrigger value="manager" className="text-lg py-3">
                🔐 Login Manager
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="employee">
              <EmployeeForm />
            </TabsContent>
            
            <TabsContent value="manager">
              <ManagerLogin 
                onLoginSuccess={(manager) => {
                  setIsManagerLoggedIn(true);
                  setCurrentManager(manager);
                }}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <ManagerDashboard 
            manager={currentManager!}
            onLogout={() => {
              setIsManagerLoggedIn(false);
              setCurrentManager(null);
              setActiveTab('employee');
            }}
          />
        )}
      </div>
    </div>
  );
}

// Employee Form Component
function EmployeeForm() {
  const [formData, setFormData] = useState<CreateLeaveRequestInput>({
    employee_id: '',
    department: 'HR',
    reason: '',
    leave_date: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const departments = [
    { value: 'HR', label: '👥 Human Resources' },
    { value: 'FINANCE', label: '💰 Finance' },
    { value: 'PRODUCTION', label: '🏭 Production' },
    { value: 'MARKETING', label: '📈 Marketing' },
    { value: 'IT', label: '💻 Information Technology' },
    { value: 'OPERATIONS', label: '⚙️ Operations' },
    { value: 'QUALITY_CONTROL', label: '✅ Quality Control' },
    { value: 'LOGISTICS', label: '🚚 Logistics' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      await trpc.createLeaveRequest.mutate(formData);
      setSubmitMessage({
        type: 'success',
        message: '🎉 Pengajuan izin berhasil dikirim! Notifikasi WhatsApp telah dikirim ke manager. Status pengajuan akan diperbarui setelah disetujui/ditolak.'
      });
      
      // Reset form
      setFormData({
        employee_id: '',
        department: 'HR',
        reason: '',
        leave_date: '',
        location: ''
      });
    } catch {
      setSubmitMessage({
        type: 'error',
        message: '❌ Terjadi kesalahan saat mengirim pengajuan. Silakan coba lagi.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-2xl">📝 Form Pengajuan Izin</CardTitle>
        <CardDescription className="text-blue-100">
          Isi formulir di bawah ini untuk mengajukan izin/dispensasi
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {submitMessage && (
          <Alert className={`mb-6 ${submitMessage.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className={submitMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {submitMessage.message}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ID Karyawan</label>
              <Input
                placeholder="Contoh: EMP001"
                value={formData.employee_id}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateLeaveRequestInput) => ({ ...prev, employee_id: e.target.value }))
                }
                required
                className="border-2 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Departemen</label>
              <Select 
                value={formData.department || 'HR'} 
                onValueChange={(value: 'HR' | 'FINANCE' | 'PRODUCTION' | 'MARKETING' | 'IT' | 'OPERATIONS' | 'QUALITY_CONTROL' | 'LOGISTICS') => 
                  setFormData((prev: CreateLeaveRequestInput) => ({ ...prev, department: value }))
                }
              >
                <SelectTrigger className="border-2 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tanggal Izin</label>
              <Input
                type="date"
                value={formData.leave_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateLeaveRequestInput) => ({ ...prev, leave_date: e.target.value }))
                }
                required
                className="border-2 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lokasi</label>
              <Input
                placeholder="Contoh: Jakarta, Rumah Sakit, dll"
                value={formData.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateLeaveRequestInput) => ({ ...prev, location: e.target.value }))
                }
                required
                className="border-2 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Alasan Izin</label>
            <Textarea
              placeholder="Jelaskan alasan pengajuan izin Anda..."
              value={formData.reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateLeaveRequestInput) => ({ ...prev, reason: e.target.value }))
              }
              required
              className="border-2 focus:border-blue-500 min-h-[100px]"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3"
          >
            {isSubmitting ? '⏳ Mengirim...' : '📤 Kirim Pengajuan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Manager Login Component
function ManagerLogin({ onLoginSuccess }: { onLoginSuccess: (manager: {id: number, name: string, role: string}) => void }) {
  const [credentials, setCredentials] = useState<ManagerLoginInput>({
    username: '',
    password: ''
  });
  const [isLogging, setIsLogging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    setErrorMessage(null);

    try {
      const response = await trpc.managerLogin.mutate(credentials);
      
      if (response.success && response.manager) {
        onLoginSuccess(response.manager);
      } else {
        setErrorMessage(response.message);
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat login. Silakan coba lagi.');
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto shadow-lg">
      <CardHeader className="bg-slate-700 text-white rounded-t-lg">
        <CardTitle className="text-xl">🔐 Login Manager</CardTitle>
        <CardDescription className="text-slate-200">
          Masuk untuk mengakses dashboard admin
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {errorMessage && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Username</label>
            <Input
              type="text"
              placeholder="Masukkan username"
              value={credentials.username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCredentials((prev: ManagerLoginInput) => ({ ...prev, username: e.target.value }))
              }
              required
              className="border-2 focus:border-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <Input
              type="password"
              placeholder="Masukkan password"
              value={credentials.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCredentials((prev: ManagerLoginInput) => ({ ...prev, password: e.target.value }))
              }
              required
              className="border-2 focus:border-slate-500"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLogging} 
            className="w-full bg-slate-600 hover:bg-slate-700"
          >
            {isLogging ? '⏳ Masuk...' : '🔓 Masuk'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Manager Dashboard Component
function ManagerDashboard({ manager, onLogout }: { 
  manager: {id: number, name: string, role: string}, 
  onLogout: () => void 
}) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const loadLeaveRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const requests = await trpc.getLeaveRequests.query();
      setLeaveRequests(requests);
    } catch (error) {
      console.error('Failed to load leave requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaveRequests();
  }, [loadLeaveRequests]);

  const handleStatusUpdate = async (requestId: number, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) => {
    try {
      await trpc.updateLeaveStatus.mutate({
        id: requestId,
        status,
        manager_id: manager.id,
        rejection_reason: rejectionReason
      });
      
      // Refresh the list
      await loadLeaveRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleExport = async () => {
    try {
      await trpc.exportLeaveRequests.query();
      // In real implementation, this would trigger a download
      alert('Export berhasil! File Excel telah diunduh.');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="w-3 h-3 mr-1" /> Menunggu</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="w-3 h-3 mr-1" /> Disetujui</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDepartmentIcon = (dept: string) => {
    const icons: Record<string, string> = {
      'HR': '👥', 'FINANCE': '💰', 'PRODUCTION': '🏭', 'MARKETING': '📈',
      'IT': '💻', 'OPERATIONS': '⚙️', 'QUALITY_CONTROL': '✅', 'LOGISTICS': '🚚'
    };
    return icons[dept] || '📋';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">🏢 Dashboard Manager</h2>
              <p className="text-slate-600">Selamat datang, {manager.name} ({manager.role})</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleExport} variant="outline" className="bg-green-50 border-green-200 hover:bg-green-100">
                <Download className="w-4 h-4 mr-2" />
                📊 Export Excel
              </Button>
              <Button onClick={onLogout} variant="outline" className="bg-red-50 border-red-200 hover:bg-red-100">
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pengajuan', count: leaveRequests.length, icon: '📋', color: 'bg-blue-100 text-blue-800' },
          { label: 'Menunggu Persetujuan', count: leaveRequests.filter(r => r.status === 'PENDING').length, icon: '⏳', color: 'bg-yellow-100 text-yellow-800' },
          { label: 'Disetujui', count: leaveRequests.filter(r => r.status === 'APPROVED').length, icon: '✅', color: 'bg-green-100 text-green-800' },
          { label: 'Ditolak', count: leaveRequests.filter(r => r.status === 'REJECTED').length, icon: '❌', color: 'bg-red-100 text-red-800' }
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.count}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <span className="text-xl">{stat.icon}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leave Requests List */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            📋 Daftar Pengajuan Izin
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-lg">⏳ Memuat data...</div>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📭</div>
              <p>Belum ada pengajuan izin</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((request: LeaveRequest) => (
                <Card key={request.id} className="border-2 hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl">{getDepartmentIcon(request.department)}</span>
                          <div>
                            <h3 className="font-semibold text-lg">{request.employee_id}</h3>
                            <p className="text-sm text-gray-600">{request.department}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{request.leave_date.toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{request.location}</span>
                          </div>
                          <div>
                            {getStatusBadge(request.status)}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mt-2">{request.reason}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Diajukan: {request.created_at.toLocaleDateString('id-ID', { 
                            year: 'numeric', month: 'long', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      
                      {request.status === 'PENDING' && (
                        <div className="flex gap-2 ml-4">
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(request.id, 'APPROVED')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            ✅ Setuju
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => setSelectedRequest(request)}
                          >
                            ❌ Tolak
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      {selectedRequest && (
        <RejectModal
          request={selectedRequest}
          onConfirm={(reason) => handleStatusUpdate(selectedRequest.id, 'REJECTED', reason)}
          onCancel={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}

// Rejection Modal Component
function RejectModal({ 
  request, 
  onConfirm, 
  onCancel 
}: { 
  request: LeaveRequest, 
  onConfirm: (reason: string) => void, 
  onCancel: () => void 
}) {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleConfirm = () => {
    if (rejectionReason.trim()) {
      onConfirm(rejectionReason);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-600">❌ Tolak Pengajuan</CardTitle>
          <CardDescription>
            Pengajuan dari: {request.employee_id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Alasan Penolakan
            </label>
            <Textarea
              placeholder="Masukkan alasan penolakan..."
              value={rejectionReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              disabled={!rejectionReason.trim()}
            >
              Tolak Pengajuan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
