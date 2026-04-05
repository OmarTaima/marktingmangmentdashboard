import axiosInstance from "../axios";
import type { Project, ProjectCreate, ProjectUpdate } from "../interfaces/projectInterface";

const PROJECTS_ENDPOINT = "/projects";

const transformProject = (raw: any): Project => {
  if (!raw) return raw;
  // Preserve normalized fields while keeping the full raw payload available
  const base: any = {
    ...raw,
    id: raw._id || raw.id || "",
    name: raw.name || raw.title || "",
    description: raw.description || "",
    clientId: raw.client?._id || raw.clientId || raw.client || undefined,
    parentProject: raw.parentProject || undefined,
    rootOnly: raw.rootOnly || false,
    published: raw.published || false,
    type: raw.type || "",
    category: raw.category || "",
    tag: raw.tag || "",
    location: raw.location || "",
    client: raw.client || null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };

  // Ensure subProjects are transformed recursively
  if (Array.isArray(raw.subProjects)) {
    base.subProjects = raw.subProjects.map(transformProject);
  } else {
    base.subProjects = [];
  }

  return base;
};

export const getProjects = async (params?: Record<string, any>): Promise<Project[]> => {
  try {
    const response = await axiosInstance.get(PROJECTS_ENDPOINT, { params });
    const responseData = response.data;
    let data: any[] = [];
    if (Array.isArray(responseData)) data = responseData;
    else if (Array.isArray(responseData?.projects)) data = responseData.projects;
    else if (Array.isArray(responseData?.data)) data = responseData.data;
    else if (Array.isArray(responseData?.data?.projects)) data = responseData.data.projects;
    else data = [];

    return data.map(transformProject).filter(Boolean);
  } catch (error) {
    throw error;
  }
};

export const createProject = async (data: ProjectCreate): Promise<Project> => {
  try {
    const response = await axiosInstance.post(PROJECTS_ENDPOINT, data);
    const raw = response.data?.project || response.data?.data?.project || response.data?.data || response.data;
    return transformProject(raw);
  } catch (error) {
    throw error;
  }
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  try {
    const response = await axiosInstance.get(`${PROJECTS_ENDPOINT}/${id}`);
    const raw = response.data?.project || response.data?.data || response.data;
    return transformProject(raw);
  } catch (error) {
    throw error;
  }
};

export const updateProject = async (id: string, data: ProjectUpdate): Promise<Project> => {
  try {
    const response = await axiosInstance.put(`${PROJECTS_ENDPOINT}/${id}`, data);
    const raw = response.data?.data || response.data;
    return transformProject(raw);
  } catch (error) {
    throw error;
  }
};

export const togglePublishProject = async (id: string): Promise<Project> => {
  try {
    const response = await axiosInstance.patch(`${PROJECTS_ENDPOINT}/${id}/publish`);
    const raw = response.data?.data || response.data;
    return transformProject(raw);
  } catch (error) {
    throw error;
  }
};

export const deleteProject = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`${PROJECTS_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
