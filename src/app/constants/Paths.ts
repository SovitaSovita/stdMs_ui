export const Paths = {
    auth: {
        login: "/api/v1/auth/login",
        register: "/api/v1/auth/register",
    },
    class: {
        upsert: "/api/v1/class",
        getClassList: "/api/v1/classes",
        getInfoClass: "/api/v1/info-classes",
        getInfoClassById: "/api/v1/info-class/detail",
        getDetail: (id: string) => `/api/v1/class/${id}/filter`,
        getSemesterAvgs: (id: string, examDate: string) => `/api/v1/class/${id}/semester/average/filter?examDate=${examDate}`,
        upsertScore: (classId: string, examId: string) => `/api/v1/scores/${classId}/${examId}`,
    },
    student: {
        getInfoList: (stuId: string) => `/api/v1/students/${stuId}`,
        upsert: "/api/v1/student",
        deleteList: "/api/v1/students/delete",
    },
    exam: {
        upsert: "/api/v1/exam",
        getById: "/api/v1/exams",
        delete: (id: string) => `/api/v1/exam/${id}`,
    },
    subject: {
        upsert: "/api/v1/subject",
        getById: "/api/v1/subject",
        delete: (id: string) => `/api/v1/subject/${id}`,
    }
}