// src/app/[locale]/(app)/projects/ProjectCard.tsx
'use client';

import React, { FC } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CardMenu, CardMenuItem } from '@/components/CardMenu';
import type { Project } from '@/types/project';

export interface ProjectCardProps {
  project: Project;
  onDelete: (id: number) => void;
}

const ProjectCard: FC<ProjectCardProps> = ({ project, onDelete }) => {
  const t = useTranslations('projects');

  return (
    <div className="relative border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
      <Link href={`/projects/${project.id}`} className="block pr-8">
        <p className="font-medium truncate">{project.name}</p>
        {project.description && <p className="text-sm text-gray-500 truncate mt-1">{project.description}</p>}
        <p className="text-sm text-gray-500 mt-2">{t('threadCount', { count: project.thread_count })}</p>
      </Link>

      <CardMenu className="absolute top-3 right-3">
        <CardMenuItem onClick={() => onDelete(project.id)}>{t('deleteProject')}</CardMenuItem>
      </CardMenu>
    </div>
  );
};

export default ProjectCard;
