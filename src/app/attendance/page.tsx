import { db } from "@/db";
import { attendance } from "@/db/schema";

export default async function AttendancePage() {
  // Fetching data directly in a Server Component
  const records = await db.select().from(attendance);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Attendance Logs</h1>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 font-medium text-gray-900 text-left">Name</th>
              <th className="px-4 py-2 font-medium text-gray-900 text-left">ID</th>
              <th className="px-4 py-2 font-medium text-gray-900 text-left">Date/Time</th>
              <th className="px-4 py-2 font-medium text-gray-900 text-left">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.map((row) => (
              <tr key={row.recordId}>
                <td className="px-4 py-2 text-gray-700">{row.personName}</td>
                <td className="px-4 py-2 text-gray-700">{row.employeeId}</td>
                <td className="px-4 py-2 text-gray-700">{row.accessDateAndTime}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${row.authenticationResult === 'true' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.authenticationResult}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}