// src/components/ProjectPDF.tsx
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

export interface ProjectData {
  id: string
  name: string
  code: string
  client_name: string
  status: string
  start_date: string
  end_date: string
  location: string
  description: string
  created_at: string
}

export default function ProjectPDFDocument({ project }: { project: ProjectData }) {
  const formatDate = (date: string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: 'Planning',
      active: 'Active',
      on_hold: 'On Hold',
      completed: 'Completed',
      cancelled: 'Cancelled',
    }
    return labels[status] || status
  }

  const getDuration = (start: string, end: string) => {
    if (!start || !end) return 'N/A'
    const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
    return `${diff} days`
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
            <Text style={[styles.title, { textAlign: 'right' }]}>Project Report</Text>
            <Text style={{ fontSize: 7, color: '#9CA3AF', textAlign: 'right' }}>
              Generated: {new Date().toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Project Summary */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
            {project.name}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Text style={{ fontSize: 10, color: '#4B5563' }}>Code: {project.code || 'N/A'}</Text>
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>•</Text>
            <Text style={{ fontSize: 10, color: '#4B5563' }}>Status: {getStatusLabel(project.status)}</Text>
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>•</Text>
            <Text style={{ fontSize: 10, color: '#4B5563' }}>Client: {project.client_name || 'N/A'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>ID: {project.id.substring(0, 8)}</Text>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <InfoRow label="Project Name" value={project.name} />
          <InfoRow label="Project Code" value={project.code || 'N/A'} />
          <InfoRow label="Status" value={getStatusLabel(project.status)} />
          <InfoRow label="Created" value={formatDate(project.created_at)} />
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <InfoRow label="Start Date" value={formatDate(project.start_date)} />
          <InfoRow label="End Date" value={formatDate(project.end_date)} />
          <InfoRow label="Duration" value={getDuration(project.start_date, project.end_date)} />
        </View>

        {/* Client & Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client & Location</Text>
          <InfoRow label="Client Name" value={project.client_name || 'N/A'} />
          <InfoRow label="Location" value={project.location || 'N/A'} />
        </View>

        {/* Description */}
        {project.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={{ fontSize: 9, color: '#4B5563', marginTop: 4 }}>{project.description}</Text>
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