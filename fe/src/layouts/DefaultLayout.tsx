import { Outlet } from "react-router-dom"
import MyHeader from "../components/MyHeader"
import MyFooter from "../components/MyFooter"

export default function DefaultLayout(){
    return(
        <div>
            <MyHeader />
            <Outlet />
            <MyFooter />
        </div>
    )
}