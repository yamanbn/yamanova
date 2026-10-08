// src/components/pdfs/EmployeePDFDocument.tsx
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// تعريف الأنماط
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    color: '#6B7280',
    width: '40%',
  },
  value: {
    fontSize: 10,
    color: '#111827',
    width: '60%',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTop: '1px solid #E5E7EB',
    paddingTop: 10,
  },
  badge: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
  },
})

interface EmployeePDFDocumentProps {
  employee: any
  organizationName: string
}

export function EmployeePDFDocument({ employee, organizationName }: EmployeePDFDocumentProps) {
  const formatDate = (date: string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981'
      case 'on_leave': return '#F59E0B'
      case 'terminated': return '#EF4444'
      default: return '#6B7280'
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>YAMANOVA</Text>
            <Text style={styles.subtitle}>Employee Profile</Text>
          </View>
          <View>
            <Text style={{ fontSize: 10, color: '#6B7280', textAlign: 'right' }}>
              {organizationName}
            </Text>
            <Text style={{ fontSize: 10, color: '#6B7280', textAlign: 'right' }}>
              #{employee.employee_code || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Employee Name & Status */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
            {employee.first_name} {employee.last_name}
          </Text>
          <Text style={{ 
            marginLeft: 10,
            backgroundColor: getStatusColor(employee.status),
            color: '#FFFFFF',
            padding: '2px 10px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 'bold',
          }}>
            {employee.status?.toUpperCase() || 'N/A'}
          </Text>
        </View>

        {/* Job Info */}
        <View style={styles.section}>
          <Text style={{ fontSize: 14, color: '#374151' }}>{employee.job_title || 'N/A'}</Text>
          <Text style={{ fontSize: 12, color: '#6B7280' }}>{employee.department || 'N/A'}</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nationality</Text>
            <Text style={styles.value}>{employee.nationality || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date of Birth</Text>
            <Text style={styles.value}>{formatDate(employee.date_of_birth)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gender</Text>
            <Text style={styles.value}>{employee.gender || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Marital Status</Text>
            <Text style={styles.value}>{employee.marital_status || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Blood Type</Text>
            <Text style={styles.value}>{employee.blood_type || 'N/A'}</Text>
          </View>
        </View>

        {/* Employment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employment Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Employee Code</Text>
            <Text style={styles.value}>{employee.employee_code || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Job Title</Text>
            <Text style={styles.value}>{employee.job_title || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Department</Text>
            <Text style={styles.value}>{employee.department || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Employment Type</Text>
            <Text style={styles.value}>{employee.employment_type?.replace('_', ' ') || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Join Date</Text>
            <Text style={styles.value}>{formatDate(employee.join_date)}</Text>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{employee.email || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{employee.phone || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{employee.address || 'N/A'}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by YAMANOVA - Smart Safety & Operations Platform</Text>
          <Text>Generated on {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  )
}