import AdminPanel from "@/components/admin-panel";

export const metadata = {
  title: "后台管理",
  description: "指定注册用户为 OP 并管理站点权限",
};

export default function AdminPage() {
  return <AdminPanel />;
}
