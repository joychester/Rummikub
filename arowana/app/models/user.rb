module Arowana
    module DBModel
        
        class User < Sequel::Model(:user)
    
            def User.getUserByName(uname)
                User[:username => uname]
            end
    
        end
    end
end