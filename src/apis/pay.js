import request from '@/utils/request'

export const getOrderAPI = (id) => {
  return request({
    url: `/member/order/${id}`
  })
}