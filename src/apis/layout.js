
import instance from "@/utils/request"

export function getCategoryAPI () {
  return instance({
    url: '/home/category/head'
  })
}