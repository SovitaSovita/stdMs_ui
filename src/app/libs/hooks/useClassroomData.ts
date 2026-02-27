import { useAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { examsAtom, studentsAtom, subjectsAtom } from "@/app/libs/jotai/classroomAtom";
import StudentService from "@/app/service/StudentService";
import SubjectService from "@/app/service/SubjectService";
import ExamService from "@/app/service/ExamService";

type UseClassroomDataOptions = {
  autoFetch?: boolean;
};

export default function useClassroomData(
  classroom?: { id?: string } | null,
  options?: UseClassroomDataOptions,
) {
  const autoFetch = options?.autoFetch ?? true;
  const [students, setStudents] = useAtom(studentsAtom);
  const [subjects, setSubjects] = useAtom(subjectsAtom);
  const [exams, setExams] = useAtom(examsAtom);

  const fetchStudents = useCallback(async () => {
    if (!classroom?.id) return;
    const result = await StudentService.getInfoList(classroom.id);
    if (result) setStudents(result);
  }, [classroom?.id, setStudents]);

  const fetchSubjects = useCallback(async () => {
    if (!classroom?.id) return;
    const result = await SubjectService.getByClassId(classroom.id);
    setSubjects(result?.length ? result : []);
  }, [classroom?.id, setSubjects]);

  const fetchExams = useCallback(async () => {
    if (!classroom?.id) return;
    const result = await ExamService.getByClassId(classroom.id);
    setExams(result?.length ? result : []);
  }, [classroom?.id, setExams]);

  useEffect(() => {
    if (!autoFetch) return;
    fetchStudents();
    fetchSubjects();
    fetchExams();
  }, [fetchStudents, fetchSubjects, fetchExams, autoFetch]);

  return { students, subjects, exams, refetch: { fetchStudents, fetchSubjects, fetchExams } };
}
