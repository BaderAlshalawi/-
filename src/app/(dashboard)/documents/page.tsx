'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Document } from '@/types'
import { formatDate } from '@/lib/utils'
import { Trash2, FileText, Download, File, Folder, Archive } from 'lucide-react'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = () => {
    fetch('/api/documents')
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data.documents || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Deletion failed')
        return
      }

      loadDocuments()
    } catch (error) {
      console.error(error)
      alert('An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    )
  }

  const portfolioDocs = documents.filter((d) => d.portfolioId)
  const productDocs = documents.filter((d) => d.productId)
  const featureDocs = documents.filter((d) => d.featureId)
  const releaseDocs = documents.filter((d) => d.releaseId)

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Documents</h1>
            <p className="text-teal-100 text-lg">Manage and organize all your documents</p>
          </div>
          <FileText className="h-16 w-16 opacity-20" />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-teal-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-3xl font-bold text-teal-600">{documents.length}</p>
              </div>
              <File className="h-10 w-10 text-teal-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Portfolio Docs</p>
                <p className="text-3xl font-bold text-blue-600">{portfolioDocs.length}</p>
              </div>
              <Folder className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Product Docs</p>
                <p className="text-3xl font-bold text-purple-600">{productDocs.length}</p>
              </div>
              <Archive className="h-10 w-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Feature Docs</p>
                <p className="text-3xl font-bold text-orange-600">{featureDocs.length}</p>
              </div>
              <FileText className="h-10 w-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Linked To</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Uploaded At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-teal-100 rounded">
                            <FileText className="h-4 w-4 text-teal-600" />
                          </div>
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.fileType ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {doc.fileType.toUpperCase()}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatFileSize(doc.fileSize ? Number(doc.fileSize) : null)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {doc.portfolioId && (
                            <Badge variant="secondary" className="text-xs">
                              Portfolio
                            </Badge>
                          )}
                          {doc.productId && (
                            <Badge variant="secondary" className="text-xs">
                              Product
                            </Badge>
                          )}
                          {doc.featureId && (
                            <Badge variant="secondary" className="text-xs">
                              Feature
                            </Badge>
                          )}
                          {doc.releaseId && (
                            <Badge variant="secondary" className="text-xs">
                              Release
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {doc.uploadedBy?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(doc.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" title="Download">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500">Upload your first document to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
