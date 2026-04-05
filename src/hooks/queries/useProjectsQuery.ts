import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Project } from "@/api/interfaces/projectInterface";
import {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    togglePublishProject,
    deleteProject,
} from "@/api/requests/projectsService";

export const projectsKeys = {
    all: ["projects"] as const,
    lists: () => [...projectsKeys.all, "list"] as const,
    list: (params?: Record<string, any>) => [...projectsKeys.lists(), params] as const,
    details: () => [...projectsKeys.all, "detail"] as const,
    detail: (id: string) => [...projectsKeys.details(), id] as const,
};

export const useProjects = (params?: Record<string, any>) => {
    return useQuery({
        queryKey: projectsKeys.list(params),
        queryFn: () => getProjects(params),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const useProject = (id?: string, opts?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: projectsKeys.detail(id || ""),
        queryFn: () => getProjectById(id || ""),
        enabled: typeof opts?.enabled === "boolean" ? opts.enabled : !!id,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Project>) => createProject(data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
        },
    });
};

export const useUpdateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
            updateProject(id, data as any),
        onSuccess: (_res, vars) => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
            if (vars?.id) queryClient.invalidateQueries({ queryKey: projectsKeys.detail(vars.id) });
        },
    });
};

export const useTogglePublishProject = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => togglePublishProject(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: projectsKeys.lists() });
        },
    });
};

export const useDeleteProject = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteProject(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: projectsKeys.lists() });
        },
    });
};

export default useProjects;
