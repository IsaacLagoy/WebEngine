"use client"

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

export function BobaShopPage() {
    return (
        <Tabs
            defaultValue="order"
            className="flex h-screen flex-col"
        >
            <div className="flex-1 overflow-hidden">
                <TabsContent
                    value="order"
                    className="h-full m-0 bg-pink-200 flex items-center justify-center flex-col"
                >
                    <div className="w-full bg-pink-300">
                        <h1 className="text-4xl font-bold">Order 🧋🐴</h1>
                    </div>

                    {/* counter for order */}
                    <div className="w-full bg-pink-400 h-50 absolute bottom-0">

                    </div>
                </TabsContent>

                <TabsContent
                    value="drink"
                    className="h-full m-0 bg-blue-200 flex items-center justify-center"
                >
                    <h1 className="text-4xl font-bold">Drink 📊👀</h1>
                </TabsContent>

                <TabsContent
                    value="toppings"
                    className="h-full m-0 bg-green-200 flex items-center justify-center"
                >
                    <h1 className="text-4xl font-bold">Toppings 📄🐎</h1>
                </TabsContent>

                <TabsContent
                    value="mix-and-lid"
                    className="h-full m-0 bg-yellow-200 flex items-center justify-center"
                >
                    <h1 className="text-4xl font-bold">Mix & Lid ⚙️👣</h1>
                </TabsContent>

                <TabsContent
                    value="checkout"
                    className="h-full m-0 bg-red-200 flex items-center justify-center"
                >
                    <h1 className="text-4xl font-bold">Checkout 💳💰</h1>   
                </TabsContent>
            </div>

            {/* Footer Navigation */}
            <footer className="bg-white p-2 z-10">
                <TabsList className="grid w-full grid-cols-4 h-14">
                    <TabsTrigger value="order">Order</TabsTrigger>
                    <TabsTrigger value="drink">Drink</TabsTrigger>
                    <TabsTrigger value="toppings">Toppings</TabsTrigger>
                    <TabsTrigger value="mix-and-lid">Mix & Lid</TabsTrigger>
                </TabsList>
            </footer>
        </Tabs>
    )
}

export default BobaShopPage