export const Paths = {
    auth: {
        login: "/api/v1/auth/login",
        register: "/api/v1/auth/register",
    },
    class: {
        getClassList: "/api/v1/classes",
        getInfoClass: "/api/v1/info-classes",
        getInfoClassById: (id: string) => {
            return `/api/v1/info-class/${id}`
        },
    },
    student: {
        getInfoList: (stuId: number) => `/api/v1/students/${stuId}`,
        upsert: "/api/v1/student",
        deleteList: "/api/v1/students/delete",
    }
}