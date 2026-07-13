// src/app/[locale]/(app)/projects/[projectId]/FilesSection.tsx
'use client';

import React, { FC, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import api from '@/lib/axios';
import { CardMenu, CardMenuItem } from '@/components/CardMenu';
import { useToast } from '@/context/ToastContext';
import type { ProjectFile } from '@/types/projectFile';

interface FilesSectionProps {
  projectId: number;
}

const FilesSection: FC<FilesSectionProps> = ({ projectId }) => {
  const t = useTranslations('projectFiles');
  const tCommon = useTranslations('common');
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ['project-files', { project_id: projectId }];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: files, isLoading } = useQuery<ProjectFile[], Error>({
    queryKey,
    queryFn: () =>
      api.get<ProjectFile[]>('/api/project-files/', { params: { project_id: projectId } }).then((r) => r.data),
    refetchInterval: (query) =>
      query.state.data?.some((file) => file.status === 'pending' || file.status === 'processing') ? 3000 : false,
  });

  const uploadFile = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('project', String(projectId));
      form.append('file', file);
      // Overrides the shared axios instance's default JSON Content-Type so
      // the browser computes the multipart boundary itself.
      return api.post<ProjectFile>('/api/project-files/', form, { headers: { 'Content-Type': undefined } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showToast(t('uploaded'));
    },
    onError: () => showToast(t('uploadError')),
  });

  const deleteFile = useMutation({
    mutationFn: (id: number) => api.delete(`/api/project-files/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const onFilesSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      Array.from(e.target.files ?? []).forEach((file) => uploadFile.mutate(file));
      e.target.value = '';
    },
    [uploadFile],
  );

  const onDelete = useCallback(
    (file: ProjectFile) => {
      if (confirm(t('deleteConfirm', { name: file.original_filename }))) {
        deleteFile.mutate(file.id);
      }
    },
    [deleteFile, t],
  );

  const statusLabel = useCallback(
    (file: ProjectFile) => {
      if (file.status === 'pending') return t('statusPending');
      if (file.status === 'processing') return t('statusProcessing');
      if (file.status === 'failed') return t('statusFailed');
      return null;
    },
    [t],
  );

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadFile.isPending}
          className="text-sm underline text-gray-500 hover:text-ink disabled:opacity-50"
        >
          {uploadFile.isPending ? t('uploading') : t('uploadButton')}
        </button>
        <input ref={fileInputRef} type="file" multiple hidden onChange={onFilesSelected} />
      </div>

      {isLoading && <p className="text-gray-500 text-sm">{tCommon('loading')}</p>}
      {!isLoading && files?.length === 0 && <p className="text-gray-500 text-sm">{t('empty')}</p>}

      <div className="grid grid-cols-2 gap-2">
        {files?.map((file) => {
          const isImage = file.content_type.startsWith('image/');
          const label = statusLabel(file);
          return (
            <div key={file.id} className="relative border border-gray-200 rounded p-3">
              <CardMenu className="absolute top-2 right-2">
                <CardMenuItem onClick={() => onDelete(file)}>{tCommon('remove')}</CardMenuItem>
              </CardMenu>
              {isImage && file.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.thumbnail_url}
                  alt={file.original_filename}
                  className="w-full h-20 object-cover rounded mb-2"
                />
              ) : (
                <FileText className="w-8 h-8 text-gray-400 mb-2" />
              )}
              <p className="text-sm font-medium truncate pr-6">{file.original_filename}</p>
              {label && (
                <p
                  className={`text-xs ${file.status === 'failed' ? 'text-red-500' : 'text-gray-500'}`}
                  title={file.status === 'failed' ? file.error_message : undefined}
                >
                  {label}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FilesSection;
