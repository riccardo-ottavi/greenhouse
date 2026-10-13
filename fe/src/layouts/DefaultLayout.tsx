import { Outlet } from "react-router-dom"
import MyHeader from "../components/MyHeader"
import MyFooter from "../components/MyFooter"
import Sidebar from "../components/Sidebar"

export default function DefaultLayout(){
    return(
        <div className="default-layout">
            <MyHeader />
            <Sidebar />
            <Outlet />
            <MyFooter />
        </div>
    )
}