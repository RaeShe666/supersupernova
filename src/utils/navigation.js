import { useEffect, useState } from 'react'

export const useNavigate = () => {
    return (path) => {
        if (path.startsWith('#')) {
            window.location.hash = path
        } else if (path.startsWith('/')) {
            window.location.hash = path
        } else {
            window.location.hash = '/' + path
        }
    }
}
