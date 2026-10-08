// src/components/EmployeePDF.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '2 solid #1E3A8A',
    paddingBottom: 10,
    marginBottom: 20,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  title: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E3A8A',
    borderBottom: '1 solid #E5E7EB',
    paddingBottom: 4,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottom: '0.5 solid #F3F4F6',
  },
  label: {
    fontSize: 9,
    color: '#6B7280',
    width: '40%',
  },
  value: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    width: '60%',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1 solid #E5E7EB',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#9CA3AF',
  },
})

export interface EmployeeData {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  job_title: string
  department: string
  employee_code: string
  status: string
  nationality: string
  date_of_birth: string
  gender: string
  marital_status: string
  blood_type: string
  join_date: string
  employment_type: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
  passport_number: string
  passport_expiry: string
  visa_number: string
  visa_expiry: string
  emirates_id: string
  emirates_id_expiry: string
  salary: number
  bank_name: string
  bank_account: string
  iban: string
  address: string
  notes: string
}

export default function EmployeePDFDocument({ employee }: { employee: EmployeeData }) {
  const formatDate = (date: string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>YAMANOVA</Text>
            <Text style={styles.title}>Smart Safety Platform</Text>
          </View>
          <View>
            <Text style={[styles.title, { textAlign: 'right' }]}>Employee Profile</Text>
            <Text style={{ fontSize: 7, color: '#9CA3AF', textAlign: 'right' }}>
              Generated: {new Date().toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Employee Summary */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
            {employee.first_name} {employee.last_name}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Text style={{ fontSize: 10, color: '#4B5563' }}>{employee.job_title || 'N/A'}</Text>
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>•</Text>
            <Text style={{ fontSize: 10, color: '#4B5563' }}>{employee.department || 'N/A'}</Text>
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>•</Text>
            <Text style={{ fontSize: 8, backgroundColor: '#10B981', color: 'white', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
              {employee.status || 'N/A'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>Code: {employee.employee_code || 'N/A'}</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>ID: {employee.id.substring(0, 8)}</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <InfoRow label="Nationality" value={employee.nationality || 'N/A'} />
          <InfoRow label="Date of Birth" value={formatDate(employee.date_of_birth)} />
          <InfoRow label="Gender" value={employee.gender || 'N/A'} />
          <InfoRow label="Marital Status" value={employee.marital_status || 'N/A'} />
          <InfoRow label="Blood Type" value={employee.blood_type || 'N/A'} />
        </View>

        {/* Employment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employment Details</Text>
          <InfoRow label="Employee Code" value={employee.employee_code || 'N/A'} />
          <InfoRow label="Job Title" value={employee.job_title || 'N/A'} />
          <InfoRow label="Department" value={employee.department || 'N/A'} />
          <InfoRow label="Employment Type" value={employee.employment_type?.replace('_', ' ') || 'N/A'} />
          <InfoRow label="Join Date" value={formatDate(employee.join_date)} />
        </View>

        {/* Documents & IDs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents & IDs</Text>
          <InfoRow label="Emirates ID" value={employee.emirates_id || 'N/A'} />
          <InfoRow label="Emirates ID Expiry" value={formatDate(employee.emirates_id_expiry)} />
          <InfoRow label="Passport" value={employee.passport_number || 'N/A'} />
          <InfoRow label="Passport Expiry" value={formatDate(employee.passport_expiry)} />
          <InfoRow label="Visa" value={employee.visa_number || 'N/A'} />
          <InfoRow label="Visa Expiry" value={formatDate(employee.visa_expiry)} />
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <InfoRow label="Email" value={employee.email || 'N/A'} />
          <InfoRow label="Phone" value={employee.phone || 'N/A'} />
          <InfoRow label="Address" value={employee.address || 'N/A'} />
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <InfoRow label="Name" value={employee.emergency_contact_name || 'N/A'} />
          <InfoRow label="Phone" value={employee.emergency_contact_phone || 'N/A'} />
          <InfoRow label="Relationship" value={employee.emergency_contact_relationship || 'N/A'} />
        </View>

        {/* Financial */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial</Text>
          <InfoRow label="Salary" value={employee.salary ? `${employee.salary} AED` : 'N/A'} />
          <InfoRow label="Bank" value={employee.bank_name || 'N/A'} />
          <InfoRow label="Account" value={employee.bank_account || 'N/A'} />
          <InfoRow label="IBAN" value={employee.iban || 'N/A'} />
        </View>

        {employee.notes && (
          <View style={{ marginTop: 8, padding: 8, backgroundColor: '#F9FAFB', borderRadius: 4 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1E3A8A' }}>Notes</Text>
            <Text style={{ fontSize: 9, color: '#4B5563', marginTop: 4 }}>{employee.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>YAMANOVA - Smart Safety Platform</Text>
          <Text style={styles.footerText}>Generated: {new Date().toLocaleString()}</Text>
        </View>
      </Page>
    </Document>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}